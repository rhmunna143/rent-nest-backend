import type { Request, RequestHandler } from "express";
import type { UserRole } from "../generated/prisma/enums.js";
import prisma from "../lib/prisma.client.js";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken, type JwtPayload } from "../utils/jwt.js";

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

const extractToken = (req: Request): string | undefined => {
  const header = req.headers.authorization;

  if (header) {
    return header.startsWith("Bearer ")
      ? header.slice("Bearer ".length)
      : header;
  }
  
  return req.cookies?.accessToken;
};

export const authenticate: RequestHandler = async (req, _res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw new AppError(
      401,
      "Authentication required. Provide a token via the Authorization header or cookie.",
    );
  }

  let payload: JwtPayload;

  try {
    payload = verifyAccessToken(token);
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
