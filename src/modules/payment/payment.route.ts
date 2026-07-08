import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { idParamsSchema } from "../../utils/commonValidation.js";
import paymentController from "./payment.controller.js";
import { createPaymentSchema } from "./payment.validation.js";

const router = Router();

router.post(
  "/payments/create",
  authenticate,
  authorize("TENANT"),
  validateRequest({ body: createPaymentSchema }),
  paymentController.createCheckoutSession,
);

// public — verified via Stripe signature, not JWT
router.post("/payments/webhook", paymentController.webhook);

router.get(
  "/payments",
  authenticate,
  authorize("TENANT"),
  paymentController.listMine,
);

router.get(
  "/payments/:id",
  authenticate,
  authorize("TENANT"),
  validateRequest({ params: idParamsSchema }),
  paymentController.getMineById,
);

export const paymentRouter = router;
