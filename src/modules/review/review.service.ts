import prisma from "../../lib/prisma.client.js";
import { AppError } from "../../utils/AppError.js";
import type { CreateReviewInput } from "./review.interface.js";

class ReviewService {
  // tenant: review a property after their rental is COMPLETED (one per rental)
  async create(tenantId: string, input: CreateReviewInput) {
    const request = await prisma.rentalRequest.findUnique({
      where: { id: input.rentalRequestId },
      select: {
        id: true,
        tenantId: true,
        propertyId: true,
        status: true,
        review: { select: { id: true } },
      },
    });

    if (!request) throw new AppError(404, "Rental request not found");

    if (request.tenantId !== tenantId) {
      throw new AppError(403, "You can only review your own rentals");
    }

    if (request.status !== "COMPLETED") {
      throw new AppError(
        409,
        `You can only review a rental after it is completed (current status: ${request.status})`,
      );
    }

    if (request.review) {
      throw new AppError(409, "You have already reviewed this rental");
    }

    return prisma.review.create({
      data: {
        tenantId,
        propertyId: request.propertyId,
        rentalRequestId: request.id,
        rating: input.rating,
        comment: input.comment ?? null,
      },
      include: {
        property: { select: { id: true, title: true, location: true } },
      },
    });
  }
}

export default new ReviewService();
