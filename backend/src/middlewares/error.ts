import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  logger.error(err.stack || err.message || err);

  if (err instanceof ZodError) {
    const errorDetails = err.errors.map((e) => `${e.path.join('.') || 'field'}: ${e.message}`).join('; ');
    return res.status(400).json({
      success: false,
      message: errorDetails || 'Validation error',
      errors: err.flatten().fieldErrors,
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || null,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}
