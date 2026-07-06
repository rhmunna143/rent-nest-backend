import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { idParamsSchema } from "../../utils/commonValidation.js";
import categoryController from "./category.controller.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "./category.validation.js";

const router = Router();

router.get("/categories", categoryController.list);

router.post(
  "/admin/categories",
  authenticate,
  authorize("ADMIN"),
  validateRequest({ body: createCategorySchema }),
  categoryController.create,
);

router.put(
  "/admin/categories/:id",
  authenticate,
  authorize("ADMIN"),
  validateRequest({ params: idParamsSchema, body: updateCategorySchema }),
  categoryController.update,
);

router.delete(
  "/admin/categories/:id",
  authenticate,
  authorize("ADMIN"),
  validateRequest({ params: idParamsSchema }),
  categoryController.remove,
);

export const categoryRouter = router;
