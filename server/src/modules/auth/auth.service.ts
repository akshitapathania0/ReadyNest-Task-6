import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Role } from '@prisma/client';
import { authRepository } from './auth.repository';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { sendEmail, emailTemplates } from '../../utils/email';
import { AppError } from '../../middlewares/error.middleware';
import { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput } from './auth.validation';
import { logger } from '../../utils/logger';

export const authService = {
  login: async (data: LoginInput) => {
    const user = await authRepository.findUserByEmail(data.email);
    if (!user) throw new AppError('Invalid credentials', 401);

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) throw new AppError('Invalid credentials', 401);

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await authRepository.saveRefreshToken(user.id, refreshToken, refreshExpiry);

    return { user, accessToken, refreshToken };
  },

  register: async (data: RegisterInput, creatorRole?: string) => {
    const existing = await authRepository.findUserByEmail(data.email);
    if (existing) throw new AppError('Email already in use', 409);

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const role = (data.role as Role) || Role.EMPLOYEE;

    // Only super admin can create HR or super admin accounts
    if (role !== Role.EMPLOYEE && creatorRole !== 'SUPER_ADMIN') {
      throw new AppError('Insufficient permissions to assign this role', 403);
    }

    const user = await authRepository.createUser({
      email: data.email,
      password: hashedPassword,
      role,
      firstName: data.firstName,
      lastName: data.lastName,
      departmentId: data.departmentId,
      designation: data.designation,
      salary: data.salary,
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
    });

    try {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to HRMS',
        html: emailTemplates.welcome(
          `${user.employee?.firstName} ${user.employee?.lastName}`,
          user.email,
          data.password
        ),
      });
    } catch (error) {
      logger.error('Welcome email failed:', error);
    }

    return user;
  },

  refreshTokens: async (refreshToken: string) => {
    const tokenRecord = await authRepository.findRefreshToken(refreshToken);
    if (!tokenRecord) throw new AppError('Invalid refresh token', 401);

    try {
      verifyRefreshToken(refreshToken);
    } catch {
      await authRepository.deleteRefreshToken(refreshToken);
      throw new AppError('Refresh token expired', 401);
    }

    const user = tokenRecord.user;
    const payload = { userId: user.id, email: user.email, role: user.role };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    await authRepository.deleteRefreshToken(refreshToken);
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await authRepository.saveRefreshToken(user.id, newRefreshToken, refreshExpiry);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  logout: async (userId: string, refreshToken?: string) => {
    if (refreshToken) {
      await authRepository.deleteRefreshToken(refreshToken);
    } else {
      await authRepository.deleteAllUserTokens(userId);
    }
  },

  forgotPassword: async (data: ForgotPasswordInput) => {
    const user = await authRepository.findUserByEmail(data.email);
    if (!user) return; // Don't reveal if email exists

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await authRepository.updatePasswordResetToken(user.id, token, expiry);

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: emailTemplates.passwordReset(
        `${user.employee?.firstName} ${user.employee?.lastName}`,
        resetUrl
      ),
    });
  },

  resetPassword: async (data: ResetPasswordInput) => {
    const user = await authRepository.findUserByResetToken(data.token);
    if (!user) throw new AppError('Invalid or expired reset token', 400);

    const hashedPassword = await bcrypt.hash(data.password, 12);
    await authRepository.updatePassword(user.id, hashedPassword);
    await authRepository.deleteAllUserTokens(user.id);
  },

  changePassword: async (userId: string, currentPassword: string, newPassword: string) => {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new AppError('User not found', 404);

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new AppError('Current password is incorrect', 400);

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await authRepository.updatePassword(userId, hashedPassword);
    await authRepository.deleteAllUserTokens(userId);
  },

  getMe: async (userId: string) => {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new AppError('User not found', 404);
    return user;
  },
};
