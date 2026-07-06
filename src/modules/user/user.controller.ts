import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse.js";
import userService from "./user.service.js";

class UserController {
  registerUser = async (req: Request, res: Response) => {
    const result = await userService.register(req.body);

    sendResponse(res, {
      statusCode: 201,
      message: "User registered successfully",
      data: result,
    });
  };

  loginUser = async (req: Request, res: Response) => {
    const result = await userService.login(req.body);

    sendResponse(res, { message: "Logged in successfully", data: result });
  };

  getMe = async (req: Request, res: Response) => {
    const user = await userService.getMe(req.user!.id);

    sendResponse(res, { message: "Profile retrieved successfully", data: user });
  };

  updateMe = async (req: Request, res: Response) => {
    const user = await userService.updateMe(req.user!.id, req.body);
    
    sendResponse(res, { message: "Profile updated successfully", data: user });
  };
}

export default new UserController();
