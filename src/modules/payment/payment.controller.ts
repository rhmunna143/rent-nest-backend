import type { Request, Response } from "express";
import type Stripe from "stripe";
import { getStripe } from "../../lib/stripe.js";
import { config } from "../../config/index.js";
import { AppError } from "../../utils/AppError.js";
import { sendResponse } from "../../utils/sendResponse.js";
import paymentService from "./payment.service.js";

class PaymentController {
  createCheckoutSession = async (req: Request, res: Response) => {
    const result = await paymentService.createCheckoutSession(
      req.user!.id,
      req.body,
    );

    sendResponse(res, {
      statusCode: 201,
      message: "Checkout session created successfully",
      data: result,
    });
  };

  // Stripe webhook — authenticated by signature, not JWT.
  // Requires the raw request body (see the express.raw mount in app.ts).
  webhook = async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];

    if (!signature || Array.isArray(signature)) {
      throw new AppError(400, "Missing Stripe signature header");
    }

    if (!config.stripeWebhookSecret) {
      throw new AppError(
        500,
        "Stripe webhook is not configured (missing STRIPE_WEBHOOK_SECRET)",
      );
    }

    let event: Stripe.Event;

    try {
      event = getStripe().webhooks.constructEvent(
        req.body,
        signature,
        config.stripeWebhookSecret,
      );
    } catch {
      throw new AppError(400, "Invalid Stripe webhook signature");
    }

    switch (event.type) {
      case "checkout.session.completed":
        await paymentService.handleCheckoutCompleted(event.data.object);
        break;
      case "checkout.session.expired":
        await paymentService.handleCheckoutExpired(event.data.object);
        break;
      default:
        break; // acknowledge events we don't handle
    }

    sendResponse(res, { message: "Webhook processed" });
  };

  listMine = async (req: Request, res: Response) => {
    const payments = await paymentService.listMine(req.user!.id);

    sendResponse(res, {
      message: "Payment history retrieved successfully",
      data: payments,
    });
  };

  getMineById = async (req: Request<{ id: string }>, res: Response) => {
    const payment = await paymentService.getMineById(
      req.user!.id,
      req.params.id,
    );

    sendResponse(res, {
      message: "Payment retrieved successfully",
      data: payment,
    });
  };
}

export default new PaymentController();
