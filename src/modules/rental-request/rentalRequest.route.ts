import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { idParamsSchema } from "../../utils/commonValidation.js";
import rentalRequestController from "./rentalRequest.controller.js";
import {
  createRentalRequestSchema,
  updateRequestStatusSchema,
} from "./rentalRequest.validation.js";

const router = Router();

// tenant
router.post(
  "/rentals",
  authenticate,
  authorize("TENANT"),
  validateRequest({ body: createRentalRequestSchema }),
  rentalRequestController.create,
);

router.get(
  "/rentals",
  authenticate,
  authorize("TENANT"),
  rentalRequestController.listMine,
);

router.get(
  "/rentals/:id",
  authenticate,
  authorize("TENANT"),
  validateRequest({ params: idParamsSchema }),
  rentalRequestController.getMineById,
);

// landlord
router.get(
  "/landlord/requests",
  authenticate,
  authorize("LANDLORD"),
  rentalRequestController.listForLandlord,
);

router.patch(
  "/landlord/requests/:id",
  authenticate,
  authorize("LANDLORD"),
  validateRequest({ params: idParamsSchema, body: updateRequestStatusSchema }),
  rentalRequestController.updateStatus,
);

export const rentalRequestRouter = router;
