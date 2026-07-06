import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError.js";
import { clearAuthCookies, setAuthCookies } from "../../utils/authCookies.js";
import { sendResponse } from "../../utils/sendResponse.js";
import userService from "./user.service.js";

class UserController {
  registerUser = async (req: Request, res: Response) => {
    const result = await userService.register(req.body);
    setAuthCookies(res, result);

    sendResponse(res, {
      statusCode: 201,
      message: "User registered successfully",
      data: result,
    });
  };

  loginUser = async (req: Request, res: Response) => {
    const result = await userService.login(req.body);
    setAuthCookies(res, result);

    sendResponse(res, { message: "Logged in successfully", data: result });
  };

  // accepts the refresh token from the cookie or the request body
  refreshToken = async (req: Request, res: Response) => {
    const token: string | undefined =
      req.cookies?.refreshToken ?? req.body?.refreshToken;

    if (!token) {
      throw new AppError(
        401,
        "Refresh token is required. Provide it via cookie or request body.",
      );
    }

    const result = await userService.refreshTokens(token);
    setAuthCookies(res, result);

    sendResponse(res, { message: "Token refreshed successfully", data: result });
  };

  logoutUser = async (_req: Request, res: Response) => {
    clearAuthCookies(res);

    sendResponse(res, { message: "Logged out successfully" });
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
