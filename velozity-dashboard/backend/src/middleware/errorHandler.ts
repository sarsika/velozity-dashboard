import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Every error in the app ends up here so the client always gets the same
// { error: { message } } shape - never a raw stack trace.
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message =
    err instanceof AppError ? err.message : "Something went wrong on our end";

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({ error: { message } });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `Route ${req.originalUrl} not found` } });
}
