import { z } from "zod";

export const registerUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("A valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["TENANT", "LANDLORD"], {
    error: "Role must be either TENANT or LANDLORD",
  }),
  phone: z.string().min(6, "Phone number is too short").optional(),
  profileImage: z.url("profileImage must be a valid URL").optional(),
});

export const loginUserSchema = z.object({
  email: z.email("A valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const updateMeSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    phone: z.string().min(6, "Phone number is too short").optional(),
    profileImage: z.url("profileImage must be a valid URL").optional(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
