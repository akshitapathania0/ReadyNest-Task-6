import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';
import {
  loginSchema, registerSchema, forgotPasswordSchema,
  resetPasswordSchema, changePasswordSchema
} from './auth.validation';
import { AuthRequest } from '../../middlewares/auth.middleware';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const authController = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = loginSchema.parse(req.body);
      const { user, accessToken, refreshToken } = await authService.login(data);

      res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

      sendSuccess(res, 'Login successful', {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          employee: user.employee,
        },
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  },

  register: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = registerSchema.parse(req.body);
      const user = await authService.register(data, req.user?.role);

      sendSuccess(res, 'Employee registered successfully', {
        id: user.id,
        email: user.email,
        role: user.role,
        employee: user.employee,
      }, 201);
    } catch (error) {
      next(error);
    }
  },

  refresh: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      if (!refreshToken) {
        sendError(res, 'Refresh token required', 401);
        return;
      }

      const tokens = await authService.refreshTokens(refreshToken);

      res.cookie('accessToken', tokens.accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

      sendSuccess(res, 'Tokens refreshed', tokens);
    } catch (error) {
      next(error);
    }
  },

  logout: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      await authService.logout(req.user!.userId, refreshToken);

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      sendSuccess(res, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  },

  forgotPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = forgotPasswordSchema.parse(req.body);
      await authService.forgotPassword(data);
      sendSuccess(res, 'If that email exists, a reset link has been sent');
    } catch (error) {
      next(error);
    }
  },

  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = resetPasswordSchema.parse(req.body);
      await authService.resetPassword(data);
      sendSuccess(res, 'Password reset successfully');
    } catch (error) {
      next(error);
    }
  },

  changePassword: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = changePasswordSchema.parse(req.body);
      await authService.changePassword(req.user!.userId, data.currentPassword, data.newPassword);

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      sendSuccess(res, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  },

  getMe: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getMe(req.user!.userId);
      sendSuccess(res, 'User retrieved', {
        id: user.id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        employee: user.employee,
      });
    } catch (error) {
      next(error);
    }
  },
};
