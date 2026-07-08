import type { z } from "zod";
import type { createPaymentSchema } from "./payment.validation.js";

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
