import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import prisma from "../config/db";
import { AppError } from "../middleware/errorHandler";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../services/token.service";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const isProd = process.env.NODE_ENV === "production";

function setRefreshCookie(res: Response, token: string) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/auth",
  });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError("Email and password are required", 400);

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError("Invalid email or password", 401);

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) throw new AppError("Invalid email or password", 401);

  const payload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  setRefreshCookie(res, refreshToken);

  res.json({
    accessToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.refreshToken;
  if (!token) throw new AppError("No refresh token", 401);

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError("Refresh token invalid or expired", 401);
  }

  const accessToken = signAccessToken({ userId: payload.userId, role: payload.role });
  res.json({ accessToken });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.json({ message: "Logged out" });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) throw new AppError("User not found", 404);
  res.json({ user });
}
