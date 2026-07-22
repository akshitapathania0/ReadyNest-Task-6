import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import prisma from '../config/database';
import { logger } from '../utils/logger';

export const logActivity = (action: string, entity?: string) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    if (req.user) {
      try {
        await prisma.activityLog.create({
          data: {
            userId: req.user.userId,
            action,
            entity,
            entityId: req.params.id,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
          },
        });
      } catch (error) {
        logger.error('Activity log error:', error);
      }
    }
    next();
  };
};
