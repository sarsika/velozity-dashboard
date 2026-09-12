import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../services/token.service";
import { AppError } from "./errorHandler";

// Extend Express's Request type so req.user is typed everywhere.
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// Checks the access token sent in the Authorization header.
// This is the ONLY way a request is considered authenticated - there is
// no frontend-only check anywhere in this app.
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError("Missing or invalid Authorization header", 401);
  }

  const token = header.split(" ")[1];

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw new AppError("Access token is invalid or expired", 401);
  }
}

// Usage: requireRole("ADMIN", "PROJECT_MANAGER")
// A developer hitting a PM-only route with a tampered token still gets
// blocked here, because the role comes from the verified JWT, not from
// anything the client can edit.
export function requireRole(...allowedRoles: TokenPayload["role"][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new AppError("You do not have permission to do that", 403);
    }
    next();
  };
}
