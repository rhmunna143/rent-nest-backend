import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserRole } from "../generated/prisma/enums.js";
import { config } from "../config/index.js";

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

type ExpiresIn = NonNullable<SignOptions["expiresIn"]>;

export const signAccessToken = (payload: JwtPayload): string =>
  jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpiresIn as ExpiresIn,
  });

export const signRefreshToken = (payload: JwtPayload): string =>
  jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn as ExpiresIn,
  });

export const verifyAccessToken = (token: string): JwtPayload =>
  jwt.verify(token, config.jwtAccessSecret) as JwtPayload;

export const verifyRefreshToken = (token: string): JwtPayload =>
  jwt.verify(token, config.jwtRefreshSecret) as JwtPayload;
