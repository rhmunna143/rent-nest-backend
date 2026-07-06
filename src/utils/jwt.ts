import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserRole } from "../generated/prisma/enums.js";
import { config } from "../config/index.js";

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export const signToken = (payload: JwtPayload): string =>
  jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as NonNullable<SignOptions["expiresIn"]>,
  });

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, config.jwtSecret) as JwtPayload;
