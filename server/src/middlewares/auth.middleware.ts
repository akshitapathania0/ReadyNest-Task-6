import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { sendError } from '../utils/response';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: JwtPayload & { employeeId?: string };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const payload = verifyAccessToken(token);

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId, deletedAt: null },
      include: { employee: { select: { id: true } } },
    });

    if (!user) {
      sendError(res, 'User not found', 401);
      return;
    }

    req.user = {
      ...payload,
      employeeId: user.employee?.id,
    };

    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }

    next();
  };
};
