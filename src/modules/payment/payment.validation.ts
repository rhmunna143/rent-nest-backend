import { z } from "zod";

export const createPaymentSchema = z.object({
  rentalRequestId: z.uuid("rentalRequestId must be a valid id"),
});
