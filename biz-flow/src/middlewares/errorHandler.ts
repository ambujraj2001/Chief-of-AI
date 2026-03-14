import { Request, Response, NextFunction } from "express";
import { logError } from "../utils/logger";

interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const status = err.statusCode ?? 500;
  const message = err.message ?? "Internal Server Error";

  logError("error_occurred", err, undefined, { statusCode: status });

  if (res.headersSent) {
    return next(err);
  }

  res.status(status).json({ error: message });
};
