import { Router } from "express";
import userController from "./user.controller.js";

const router = Router();

router.post("/auth/register", userController.registerUser);
router.post("/auth/login", userController.loginUser);
router.get("/auth/me", userController.getMe);
router.patch("/auth/me", userController.updateMe);

export const userRouter = router;
