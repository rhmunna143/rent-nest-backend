import type { z } from "zod";
import type {
  createRentalRequestSchema,
  rentalStatusQuerySchema,
  updateRequestStatusSchema,
} from "./rentalRequest.validation.js";

export type CreateRentalRequestInput = z.infer<
  typeof createRentalRequestSchema
>;

export type UpdateRequestStatusInput = z.infer<
  typeof updateRequestStatusSchema
>;

export type RentalStatusQuery = z.infer<typeof rentalStatusQuerySchema>;
