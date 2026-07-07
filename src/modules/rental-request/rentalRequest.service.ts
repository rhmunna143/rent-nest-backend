import type { Prisma } from "../../generated/prisma/client.js";
import prisma from "../../lib/prisma.client.js";
import { AppError } from "../../utils/AppError.js";
import type {
  CreateRentalRequestInput,
  RentalStatusQuery,
  UpdateRequestStatusInput,
} from "./rentalRequest.interface.js";

const propertySummarySelect = {
  id: true,
  title: true,
  location: true,
  rentAmount: true,
  status: true,
  images: true,
} as const;

const tenantContactSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  profileImage: true,
} as const;

const paymentSummarySelect = {
  id: true,
  amount: true,
  status: true,
  paidAt: true,
} as const;

class RentalRequestService {
  // tenant: submit a request for an available property
  async create(tenantId: string, input: CreateRentalRequestInput) {
    const property = await prisma.property.findUnique({
      where: { id: input.propertyId },
      select: { id: true, status: true, landlordId: true },
    });

    if (!property) throw new AppError(404, "Property not found");

    if (property.status !== "AVAILABLE") {
      throw new AppError(409, "This property is not available for rent");
    }

    if (property.landlordId === tenantId) {
      throw new AppError(403, "You cannot request your own property");
    }

    const duplicate = await prisma.rentalRequest.findFirst({
      where: { tenantId, propertyId: input.propertyId, status: "PENDING" },
      select: { id: true },
    });

    if (duplicate) {
      throw new AppError(
        409,
        "You already have a pending request for this property",
      );
    }
    
    return prisma.rentalRequest.create({
      data: {
        tenantId,
        propertyId: input.propertyId,
        message: input.message ?? null,
        moveInDate: input.moveInDate ?? null,
      },
      include: { property: { select: propertySummarySelect } },
    });
  }

  // tenant: own request history (optionally filtered by status)
  async listMine(tenantId: string, query: RentalStatusQuery) {
    const where: Prisma.RentalRequestWhereInput = { tenantId };
    if (query.status) where.status = query.status;

    return prisma.rentalRequest.findMany({
      where,
      include: {
        property: { select: propertySummarySelect },
        payment: { select: paymentSummarySelect },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // tenant: own request details (including payment status)
  async getMineById(tenantId: string, id: string) {
    const request = await prisma.rentalRequest.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            ...propertySummarySelect,
            landlord: { select: { id: true, name: true } },
          },
        },
        payment: true,
      },
    });

    if (!request) throw new AppError(404, "Rental request not found");

    if (request.tenantId !== tenantId) {
      throw new AppError(403, "You can only view your own rental requests");
    }

    return request;
  }

  // landlord: all requests on own properties (optionally filtered by status)
  async listForLandlord(landlordId: string, query: RentalStatusQuery) {
    const where: Prisma.RentalRequestWhereInput = {
      property: { landlordId },
    };
    if (query.status) where.status = query.status;

    return prisma.rentalRequest.findMany({
      where,
      include: {
        property: { select: propertySummarySelect },
        tenant: { select: tenantContactSelect },
        payment: { select: paymentSummarySelect },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // landlord: approve/reject a PENDING request, or complete an ACTIVE rental
  async updateStatus(
    landlordId: string,
    id: string,
    input: UpdateRequestStatusInput,
  ) {
    const request = await prisma.rentalRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        propertyId: true,
        property: { select: { landlordId: true } },
      },
    });

    if (!request) throw new AppError(404, "Rental request not found");

    if (request.property.landlordId !== landlordId) {
      throw new AppError(
        403,
        "You can only manage requests for your own properties",
      );
    }

    const include = {
      property: { select: propertySummarySelect },
      tenant: { select: tenantContactSelect },
    };

    if (input.status === "APPROVED" || input.status === "REJECTED") {
      if (request.status !== "PENDING") {
        throw new AppError(
          409,
          `Only PENDING requests can be ${input.status.toLowerCase()} (current status: ${request.status})`,
        );
      }

      return prisma.rentalRequest.update({
        where: { id },
        data: { status: input.status },
        include,
      });
    }

    // COMPLETED: rental must be ACTIVE; property becomes AVAILABLE again
    if (request.status !== "ACTIVE") {
      throw new AppError(
        409,
        `Only ACTIVE rentals can be completed (current status: ${request.status})`,
      );
    }

    const [updated] = await prisma.$transaction([
      prisma.rentalRequest.update({
        where: { id },
        data: { status: "COMPLETED" },
        include,
      }),
      prisma.property.update({
        where: { id: request.propertyId },
        data: { status: "AVAILABLE" },
      }),
    ]);

    return updated;
  }
}

export default new RentalRequestService();
