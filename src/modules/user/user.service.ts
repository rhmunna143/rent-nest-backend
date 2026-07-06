import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma.client.js";
import { config } from "../../config/index.js";
import { AppError } from "../../utils/AppError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type JwtPayload,
} from "../../utils/jwt.js";
import type {
  AuthResult,
  LoginUserInput,
  RegisterUserInput,
  SafeUser,
  UpdateMeInput,
} from "./user.interface.js";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  profileImage: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

const issueTokens = (payload: JwtPayload) => ({
  accessToken: signAccessToken(payload),
  refreshToken: signRefreshToken(payload),
});

class UserService {
  // register user
  async register(input: RegisterUserInput): Promise<AuthResult> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existing) {
      throw new AppError(409, "An account with this email already exists");
    }

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: await bcrypt.hash(input.password, config.bcryptSaltRounds),
        role: input.role,
        phone: input.phone ?? null,
        profileImage: input.profileImage ?? null,
      },
      select: safeUserSelect,
    });

    return { user, ...issueTokens({ userId: user.id, role: user.role }) };
  }

  // login user
  async login(input: LoginUserInput): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user || !(await bcrypt.compare(input.password, user.password))) {
      throw new AppError(401, "Invalid email or password");
    }

    if (user.status === "BANNED") {
      throw new AppError(403, "Your account has been banned");
    }

    const { password: _password, ...safeUser } = user;

    return {
      user: safeUser,
      ...issueTokens({ userId: user.id, role: user.role }),
    };
  }

  // refresh tokens
  async refreshTokens(refreshToken: string): Promise<AuthResult> {
    let payload: JwtPayload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(401, "Invalid or expired refresh token");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: safeUserSelect,
    });

    if (!user) throw new AppError(401, "User no longer exists");

    if (user.status === "BANNED") {
      throw new AppError(403, "Your account has been banned");
    }

    return { user, ...issueTokens({ userId: user.id, role: user.role }) };
  }

  // get me/current user
  async getMe(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: safeUserSelect,
    });
    if (!user) throw new AppError(404, "User not found");
    return user;
  }

  // update me/current user
  async updateMe(userId: string, input: UpdateMeInput): Promise<SafeUser> {
    const data: Record<string, string> = {};

    if (input.name !== undefined) data["name"] = input.name;

    if (input.phone !== undefined) data["phone"] = input.phone;

    if (input.profileImage !== undefined)
      data["profileImage"] = input.profileImage;

    if (input.password !== undefined) {
      data["password"] = await bcrypt.hash(
        input.password,
        config.bcryptSaltRounds,
      );
    }

    return prisma.user.update({
      where: { id: userId },
      data,
      select: safeUserSelect,
    });
  }
}

export default new UserService();
