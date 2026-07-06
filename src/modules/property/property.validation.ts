import { z } from "zod";

export const createPropertySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(2, "Location is required"),
  rentAmount: z.number().positive("rentAmount must be a positive number"),
  bedrooms: z.number().int().min(0, "bedrooms must be 0 or more"),
  bathrooms: z.number().int().min(1, "bathrooms must be 1 or more").optional(),
  amenities: z.array(z.string().min(1)).optional(),
  images: z.array(z.url("Each image must be a valid URL")).optional(),
  categoryId: z.uuid("categoryId must be a valid id"),
});

export const updatePropertySchema = z
  .object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    location: z.string().min(2).optional(),
    rentAmount: z.number().positive().optional(),
    bedrooms: z.number().int().min(0).optional(),
    bathrooms: z.number().int().min(1).optional(),
    amenities: z.array(z.string().min(1)).optional(),
    images: z.array(z.url()).optional(),
    categoryId: z.uuid().optional(),
    status: z.enum(["AVAILABLE", "RENTED", "UNAVAILABLE"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// Query params arrive as strings, so coerce the numeric ones.
export const propertyQuerySchema = z.object({
  location: z.string().optional(),
  search: z.string().optional(),
  categoryId: z.uuid("categoryId must be a valid id").optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["createdAt", "rentAmount", "title"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
