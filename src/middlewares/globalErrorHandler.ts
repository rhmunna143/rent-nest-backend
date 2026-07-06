import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../utils/AppError.js";

// Maps every thrown error to the mandatory `{ success, message, errorDetails }` envelope.
export const globalErrorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next,
) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errorDetails: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorDetails: err.errorDetails,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        success: false,
        message: "A record with this value already exists",
        errorDetails: { fields: err.meta?.["target"] ?? null },
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "The requested record was not found",
        errorDetails: null,
      });
      return;
    }
  }

  console.error(err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    errorDetails:
      process.env.NODE_ENV === "production"
        ? null
        : { message: err instanceof Error ? err.message : String(err) },
  });
};
