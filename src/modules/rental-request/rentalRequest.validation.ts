import { z } from "zod";

export const createRentalRequestSchema = z.object({
  propertyId: z.uuid("propertyId must be a valid id"),
  message: z.string().min(1).max(1000).optional(),
  moveInDate: z.coerce.date("moveInDate must be a valid date").optional(),
});

// Landlord decision + completion. APPROVED → ACTIVE happens only via payment.
export const updateRequestStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "COMPLETED"], {
    error: "Status must be APPROVED, REJECTED, or COMPLETED",
  }),
});

export const rentalStatusQuerySchema = z.object({
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "ACTIVE", "COMPLETED"])
    .optional(),
});
