import type Stripe from "stripe";
import type { Prisma } from "../../generated/prisma/client.js";
import prisma from "../../lib/prisma.client.js";
import { getStripe } from "../../lib/stripe.js";
import { config } from "../../config/index.js";
import { AppError } from "../../utils/AppError.js";
import type { CreatePaymentInput } from "./payment.interface.js";

const rentalSummarySelect = {
  id: true,
  status: true,
  moveInDate: true,
  property: { select: { id: true, title: true, location: true } },
} as const;

class PaymentService {
  // tenant: create a Stripe Checkout Session for an APPROVED rental request
  async createCheckoutSession(tenantId: string, input: CreatePaymentInput) {
    const request = await prisma.rentalRequest.findUnique({
      where: { id: input.rentalRequestId },
      include: {
        property: {
          select: { id: true, title: true, location: true, rentAmount: true },
        },
        payment: { select: { status: true } },
      },
    });

    if (!request) throw new AppError(404, "Rental request not found");

    if (request.tenantId !== tenantId) {
      throw new AppError(403, "You can only pay for your own rental requests");
    }

    if (request.payment?.status === "COMPLETED") {
      throw new AppError(409, "This rental request has already been paid");
    }

    if (request.status !== "APPROVED") {
      throw new AppError(
        409,
        `Only APPROVED rental requests can be paid (current status: ${request.status})`,
      );
    }

    const amount = Number(request.property.rentAmount);

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(amount * 100), // Stripe expects cents
            product_data: {
              name: request.property.title,
              description: `First month's rent — ${request.property.location}`,
            },
          },
        },
      ],
      metadata: { rentalRequestId: request.id },
      success_url: `${config.paymentSuccessUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: config.paymentCancelUrl,
    });

    // one payment row per rental request — a retry replaces the stale session
    const payment = await prisma.payment.upsert({
      where: { rentalRequestId: request.id },
      update: {
        stripeSessionId: session.id,
        amount,
        status: "PENDING",
        transactionId: null,
        paidAt: null,
      },
      create: {
        rentalRequestId: request.id,
        stripeSessionId: session.id,
        amount,
      },
    });

    return { checkoutUrl: session.url, sessionId: session.id, payment };
  }

  // webhook: payment succeeded — activate the rental
  async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const rentalInclude = {
      rentalRequest: { select: { id: true, propertyId: true, status: true } },
    } as const;

    let payment = await prisma.payment.findUnique({
      where: { stripeSessionId: session.id },
      include: rentalInclude,
    });

    // A checkout retry replaces the payment row's session id, so an event for
    // the older session won't match — fall back to the rental request id we
    // stored in the session metadata when creating it.
    if (!payment) {
      const rentalRequestId = session.metadata?.["rentalRequestId"];
      if (!rentalRequestId) return; // not one of ours

      payment = await prisma.payment.findUnique({
        where: { rentalRequestId },
        include: rentalInclude,
      });
    }

    // unknown session or duplicate delivery — nothing to do (idempotent)
    if (!payment || payment.status === "COMPLETED") return;

    const transactionId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);

    const updates: Prisma.PrismaPromise<unknown>[] = [
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          stripeSessionId: session.id, // keep the row pointing at the session that was actually paid
          transactionId,
          paidAt: new Date(),
        },
      }),
    ];

    // Activate only rentals still awaiting activation — a late webhook retry
    // must not resurrect a rental the landlord has already completed.
    if (payment.rentalRequest.status === "APPROVED") {
      updates.push(
        prisma.rentalRequest.update({
          where: { id: payment.rentalRequestId },
          data: { status: "ACTIVE" },
        }),
        prisma.property.update({
          where: { id: payment.rentalRequest.propertyId },
          data: { status: "RENTED" },
        }),
        // the property is taken — reject everyone else still waiting
        prisma.rentalRequest.updateMany({
          where: {
            propertyId: payment.rentalRequest.propertyId,
            status: "PENDING",
          },
          data: { status: "REJECTED" },
        }),
      );
    }

    await prisma.$transaction(updates);
  }

  // webhook: checkout session expired without payment
  async handleCheckoutExpired(session: Stripe.Checkout.Session) {
    await prisma.payment.updateMany({
      where: { stripeSessionId: session.id, status: "PENDING" },
      data: { status: "FAILED" },
    });
  }

  // tenant: own payment history
  async listMine(tenantId: string) {
    return prisma.payment.findMany({
      where: { rentalRequest: { tenantId } },
      include: { rentalRequest: { select: rentalSummarySelect } },
      orderBy: { createdAt: "desc" },
    });
  }

  // tenant: own payment details
  async getMineById(tenantId: string, id: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        rentalRequest: {
          select: { ...rentalSummarySelect, tenantId: true },
        },
      },
    });

    if (!payment) throw new AppError(404, "Payment not found");

    if (payment.rentalRequest.tenantId !== tenantId) {
      throw new AppError(403, "You can only view your own payments");
    }

    return payment;
  }
}

export default new PaymentService();
