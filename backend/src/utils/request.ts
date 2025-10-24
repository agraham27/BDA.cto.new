import { Request } from 'express';

export function getRequestContext(req: Request): {
  ipAddress?: string | null;
  userAgent?: string | null;
} {
  return {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  };
}
