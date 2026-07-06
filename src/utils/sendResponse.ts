import type { Response } from "express";

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SendResponseOptions<T> {
  statusCode?: number;
  message: string;
  data?: T;
  meta?: Meta;
}

export const sendResponse = <T>(
  res: Response,
  { statusCode = 200, message, data, meta }: SendResponseOptions<T>,
): void => {
  const body: Record<string, unknown> = {
    success: true,
    message,
    data: data ?? null,
  };
  if (meta) body["meta"] = meta;
  res.status(statusCode).json(body);
};
