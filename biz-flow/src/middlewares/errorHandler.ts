import { Request, Response, NextFunction } from 'express';
import { logError } from '../utils/logger';

interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const status = err.statusCode ?? 500;
  const message = err.message ?? 'Internal Server Error';

  logError('error_occurred', err, undefined, { statusCode: status });

  res.status(status).json({ error: message });
};
