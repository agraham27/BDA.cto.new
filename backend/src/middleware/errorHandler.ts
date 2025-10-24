import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Request validation failed',
      errors: err.issues,
    });
  }

  const statusCode = err instanceof AppError ? err.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Something went wrong';

  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
