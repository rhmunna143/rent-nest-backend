import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import reviewController from "./review.controller.js";
import { createReviewSchema } from "./review.validation.js";

const router = Router();

router.post(
  "/reviews",
  authenticate,
  authorize("TENANT"),
  validateRequest({ body: createReviewSchema }),
  reviewController.create,
);

export const reviewRouter = router;
