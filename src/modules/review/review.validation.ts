import { z } from "zod";

export const createReviewSchema = z.object({
  rentalRequestId: z.uuid("rentalRequestId must be a valid id"),
  rating: z
    .number()
    .int("Rating must be a whole number")
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  comment: z.string().min(1).max(1000).optional(),
});
