import type { RequestHandler } from "express";
import type { UserRole } from "../generated/prisma/enums.js";
import prisma from "../lib/prisma.client.js";
import { AppError } from "../utils/AppError.js";
import { verifyToken, type JwtPayload } from "../utils/jwt.js";

export interface AuthUser {
  id: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "Authentication required. Provide a Bearer token.");
  }

  let payload: JwtPayload;

  try {
    payload = verifyToken(header.slice("Bearer ".length));
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, status: true },
  });

  if (!user) throw new AppError(401, "User no longer exists");

  if (user.status === "BANNED") {
    throw new AppError(403, "Your account has been banned");
  }

  req.user = { id: user.id, role: user.role };
  next();
};

export const authorize =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(
        403,
        "You do not have permission to perform this action",
      );
    }
    next();
  };
