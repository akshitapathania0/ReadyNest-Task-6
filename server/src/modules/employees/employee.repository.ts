import prisma from '../../config/database';
import { EmploymentStatus, Prisma } from '@prisma/client';

export interface EmployeeFilters {
  search?: string;
  departmentId?: string;
  status?: EmploymentStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const employeeRepository = {
  findAll: async (filters: EmployeeFilters) => {
    const {
      search, departmentId, status,
      page = 1, limit = 10,
      sortBy = 'createdAt', sortOrder = 'desc'
    } = filters;

    const where: Prisma.EmployeeWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(departmentId && { departmentId }),
      ...(search && {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { employeeId: { contains: search } },
          { designation: { contains: search } },
          { user: { email: { contains: search } } },
        ],
      }),
    };

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, role: true } },
          department: true,
          manager: {
            select: { id: true, firstName: true, lastName: true, profilePhoto: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.employee.count({ where }),
    ]);

    return { employees, total };
  },

  findById: async (id: string) => {
    return prisma.employee.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, email: true, role: true, isEmailVerified: true } },
        department: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, profilePhoto: true, designation: true },
        },
        subordinates: {
          where: { deletedAt: null },
          select: { id: true, firstName: true, lastName: true, profilePhoto: true, designation: true },
        },
        documents: { where: { deletedAt: null } },
        leaveBalances: true,
      },
    });
  },

  findByUserId: async (userId: string) => {
    return prisma.employee.findFirst({
      where: { userId, deletedAt: null },
      include: {
        user: { select: { id: true, email: true, role: true } },
        department: true,
      },
    });
  },

  update: async (id: string, data: Prisma.EmployeeUpdateInput) => {
    return prisma.employee.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, email: true, role: true } },
        department: true,
      },
    });
  },

  softDelete: async (id: string) => {
    const employee = await prisma.employee.findUnique({ where: { id }, select: { userId: true } });
    if (employee) {
      await prisma.user.update({
        where: { id: employee.userId },
        data: { deletedAt: new Date() },
      });
    }
    return prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'TERMINATED' },
    });
  },

  countByDepartment: async () => {
    return prisma.employee.groupBy({
      by: ['departmentId'],
      where: { deletedAt: null, status: 'ACTIVE' },
      _count: true,
    });
  },

  countByStatus: async () => {
    return prisma.employee.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: true,
    });
  },

  getRecentJoinees: async (limit = 5) => {
    return prisma.employee.findMany({
      where: { deletedAt: null },
      include: {
        department: true,
        user: { select: { email: true } },
      },
      orderBy: { joiningDate: 'desc' },
      take: limit,
    });
  },
};
