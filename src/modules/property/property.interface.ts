import type { z } from "zod";
import type {
  createPropertySchema,
  propertyQuerySchema,
  updatePropertySchema,
} from "./property.validation.js";

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type PropertyListQuery = z.infer<typeof propertyQuerySchema>;

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
