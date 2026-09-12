import jwt, { SignOptions } from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
  role: "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

// jsonwebtoken's types want expiresIn as a number of seconds or its own
// "StringValue" union, not a plain string - cast keeps .env free-form
// (e.g. "15m", "7d") while still satisfying the compiler.
const accessOptions: SignOptions = {
  expiresIn: (process.env.ACCESS_TOKEN_EXPIRES_IN || "15m") as SignOptions["expiresIn"],
};
const refreshOptions: SignOptions = {
  expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
};

export function signAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, ACCESS_SECRET, accessOptions);
}

export function signRefreshToken(payload: TokenPayload) {
  return jwt.sign(payload, REFRESH_SECRET, refreshOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}
