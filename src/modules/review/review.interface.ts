import type { z } from "zod";
import type { createReviewSchema } from "./review.validation.js";

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
