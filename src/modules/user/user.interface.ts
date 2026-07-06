import type { z } from "zod";
import type { User } from "../../generated/prisma/client.js";
import type {
  loginUserSchema,
  registerUserSchema,
  updateMeSchema,
} from "./user.validation.js";

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;

export type SafeUser = Omit<User, "password">;

export interface AuthResult {
  user: SafeUser;
  token: string;
}
