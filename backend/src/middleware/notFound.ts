import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

export function notFoundHandler(_req: Request, res: Response, _next: NextFunction): void {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route ${_req.method} ${_req.originalUrl} not found`,
  });
}
