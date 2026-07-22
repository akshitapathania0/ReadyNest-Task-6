import prisma from '../../config/database';
import { Role } from '@prisma/client';

export const authRepository = {
  findUserByEmail: async (email: string) => {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: {
        employee: {
          include: {
            department: true,
          },
        },
      },
    });
  },

  findUserById: async (id: string) => {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });
  },

  createUser: async (data: {
    email: string;
    password: string;
    role: Role;
    firstName: string;
    lastName: string;
    departmentId?: string;
    designation?: string;
    salary?: number;
    joiningDate?: Date;
  }) => {
    const { firstName, lastName, departmentId, designation, salary, joiningDate, ...userData } = data;
    const employeeCount = await prisma.employee.count();
    const employeeId = `EMP${String(employeeCount + 1).padStart(4, '0')}`;

    return prisma.user.create({
      data: {
        ...userData,
        employee: {
          create: {
            employeeId,
            firstName,
            lastName,
            departmentId,
            designation,
            salary: salary || 0,
            joiningDate: joiningDate || new Date(),
          },
        },
      },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });
  },

  saveRefreshToken: async (userId: string, token: string, expiresAt: Date) => {
    return prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  },

  findRefreshToken: async (token: string) => {
    return prisma.refreshToken.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
  },

  deleteRefreshToken: async (token: string) => {
    return prisma.refreshToken.deleteMany({ where: { token } });
  },

  deleteAllUserTokens: async (userId: string) => {
    return prisma.refreshToken.deleteMany({ where: { userId } });
  },

  updatePasswordResetToken: async (userId: string, token: string | null, expiry: Date | null) => {
    return prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: token,
        passwordResetExpiry: expiry,
      },
    });
  },

  findUserByResetToken: async (token: string) => {
    return prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
        deletedAt: null,
      },
      include: { employee: true },
    });
  },

  updatePassword: async (userId: string, hashedPassword: string) => {
    return prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });
  },

  verifyEmail: async (token: string) => {
    return prisma.user.updateMany({
      where: { emailVerifyToken: token },
      data: { isEmailVerified: true, emailVerifyToken: null },
    });
  },
};
