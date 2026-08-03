import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { prisma } from '../config/prisma';

export function auditLog(action: string, targetResource: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        try {
          await prisma.auditLog.create({
            data: {
              userId: req.user?.userId || null,
              userEmail: req.user?.email || 'Anonymous',
              action,
              targetResource,
              details: JSON.stringify({ body: req.body, query: req.query, params: req.params }),
              ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1',
            },
          });
        } catch (err) {
          // Silent catch for audit log non-blocking write
        }
      }
    });
    next();
  };
}
