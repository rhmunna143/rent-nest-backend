import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import userController from "./user.controller.js";
import {
  loginUserSchema,
  registerUserSchema,
  updateMeSchema,
} from "./user.validation.js";

const router = Router();

router.post(
  "/auth/register",
  validateRequest({ body: registerUserSchema }),
  userController.registerUser,
);

router.post(
  "/auth/login",
  validateRequest({ body: loginUserSchema }),
  userController.loginUser,
);

router.get("/auth/me", authenticate, userController.getMe);

router.patch(
  "/auth/me",
  authenticate,
  validateRequest({ body: updateMeSchema }),
  userController.updateMe,
);

export const userRouter = router;
