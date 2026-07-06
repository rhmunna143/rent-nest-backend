import type { CookieOptions, Response } from "express";
import { config } from "../config/index.js";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === "production",
  sameSite: config.nodeEnv === "production" ? "none" : "lax",
};

export const setAuthCookies = (res: Response, tokens: TokenPair): void => {
  res.cookie("accessToken", tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: config.accessCookieMaxAgeMs,
  });

  res.cookie("refreshToken", tokens.refreshToken, {
    ...baseCookieOptions,
    maxAge: config.refreshCookieMaxAgeMs,
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie("accessToken", baseCookieOptions);
  res.clearCookie("refreshToken", baseCookieOptions);
};
