import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { idParamsSchema } from "../../utils/commonValidation.js";
import propertyController from "./property.controller.js";
import {
  createPropertySchema,
  updatePropertySchema,
} from "./property.validation.js";

const router = Router();

// public
router.get("/properties", propertyController.listPublic);

router.get(
  "/properties/:id",
  validateRequest({ params: idParamsSchema }),
  propertyController.getById,
);

// landlord management
router.post(
  "/landlord/properties",
  authenticate,
  authorize("LANDLORD"),
  validateRequest({ body: createPropertySchema }),
  propertyController.create,
);

router.get(
  "/landlord/properties",
  authenticate,
  authorize("LANDLORD"),
  propertyController.listMine,
);

router.put(
  "/landlord/properties/:id",
  authenticate,
  authorize("LANDLORD"),
  validateRequest({ params: idParamsSchema, body: updatePropertySchema }),
  propertyController.update,
);

router.delete(
  "/landlord/properties/:id",
  authenticate,
  authorize("LANDLORD"),
  validateRequest({ params: idParamsSchema }),
  propertyController.remove,
);

export const propertyRouter = router;
