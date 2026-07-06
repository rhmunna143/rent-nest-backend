import type { RequestHandler } from "express";
import type { ZodType } from "zod";

interface RequestSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

// Validates body/params/query against Zod schemas; parsed body replaces req.body.
export const validateRequest =
  (schemas: RequestSchemas): RequestHandler =>
  async (req, _res, next) => {
    if (schemas.body) req.body = await schemas.body.parseAsync(req.body);
    if (schemas.params) await schemas.params.parseAsync(req.params);
    if (schemas.query) await schemas.query.parseAsync(req.query);
    next();
  };
