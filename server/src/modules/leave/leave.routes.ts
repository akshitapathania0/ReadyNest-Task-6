import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import prisma from '../../config/database';
import { sendSuccess, sendError, getPaginationParams } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import { sendEmail, emailTemplates } from '../../utils/email';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

const leaveRequestSchema = z.object({
  leaveType: z.enum(['SICK', 'CASUAL', 'PAID', 'WORK_FROM_HOME', 'MATERNITY', 'PATERNITY', 'UNPAID']),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(10, 'Please provide a detailed reason'),
});

const LEAVE_DEFAULTS: Record<string, number> = {
  SICK: 10, CASUAL: 12, PAID: 15, WORK_FROM_HOME: 24,
  MATERNITY: 90, PATERNITY: 5, UNPAID: 0,
};

// Get leave balances
router.get('/balances', async (req: AuthRequest, res, next) => {
  try {
    const employeeId = req.user!.role === 'EMPLOYEE'
      ? req.user!.employeeId!
      : (req.query.employeeId as string) || req.user!.employeeId!;

    const year = parseInt(req.query.year as string || String(new Date().getFullYear()));

    let balances = await prisma.leaveBalance.findMany({
      where: { employeeId, year },
    });

    // Initialize balances if not existing
    if (balances.length === 0) {
      const data = Object.entries(LEAVE_DEFAULTS).map(([leaveType, total]) => ({
        employeeId, year, leaveType: leaveType as never, total, used: 0, remaining: total,
      }));
      await prisma.leaveBalance.createMany({ data });
      balances = await prisma.leaveBalance.findMany({ where: { employeeId, year } });
    }

    sendSuccess(res, 'Leave balances', balances);
  } catch (error) { next(error); }
});

// Apply for leave
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = leaveRequestSchema.parse(req.body);
    const employeeId = req.user!.employeeId!;
    const year = new Date(data.startDate).getFullYear();

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (days <= 0) {
      sendError(res, 'End date must be after start date', 400);
      return;
    }

    // Check leave balance
    let balance = await prisma.leaveBalance.findUnique({
      where: { employeeId_leaveType_year: { employeeId, leaveType: data.leaveType, year } },
    });

    if (!balance) {
      const total = LEAVE_DEFAULTS[data.leaveType] || 0;
      balance = await prisma.leaveBalance.create({
        data: { employeeId, leaveType: data.leaveType, year, total, used: 0, remaining: total },
      });
    }

    if (data.leaveType !== 'UNPAID' && balance.remaining < days) {
      sendError(res, `Insufficient leave balance. Available: ${balance.remaining} days`, 400);
      return;
    }

    // Check for overlapping leaves
    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
      },
    });

    if (overlap) {
      sendError(res, 'Leave request overlaps with an existing request', 400);
      return;
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType: data.leaveType,
        startDate,
        endDate,
        days,
        reason: data.reason,
      },
      include: {
        employee: {
          include: { user: true, department: true },
        },
      },
    });

    sendSuccess(res, 'Leave request submitted', leave, 201);
  } catch (error) { next(error); }
});

// Get my leave requests
router.get('/my', async (req: AuthRequest, res, next) => {
  try {
    const employeeId = req.user!.employeeId!;
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, string>);
    const { status, year } = req.query as Record<string, string>;

    const where: Record<string, unknown> = { employeeId };
    if (status) where.status = status;
    if (year) {
      where.startDate = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      };
    }

    const [leaves, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    sendSuccess(res, 'Leave requests', leaves, 200, {
      total, page, limit, totalPages: Math.ceil(total / limit),
    });
  } catch (error) { next(error); }
});

// Get all leave requests (HR/Admin)
router.get('/', authorize('SUPER_ADMIN', 'HR'), async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, string>);
    const { status, employeeId, departmentId } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;
    if (departmentId) {
      where.employee = { departmentId };
    }

    const [leaves, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true, firstName: true, lastName: true,
              employeeId: true, profilePhoto: true,
              department: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    sendSuccess(res, 'Leave requests', leaves, 200, {
      total, page, limit, totalPages: Math.ceil(total / limit),
    });
  } catch (error) { next(error); }
});

// Approve/Reject leave
router.put('/:id/status', authorize('SUPER_ADMIN', 'HR'), async (req: AuthRequest, res, next) => {
  try {
    const { status, rejectedReason } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      sendError(res, 'Invalid status', 400);
      return;
    }

    const leave = await prisma.leaveRequest.findUnique({
      where: { id: req.params.id },
      include: {
        employee: { include: { user: true } },
      },
    });

    if (!leave) throw new AppError('Leave request not found', 404);
    if (leave.status !== 'PENDING') {
      sendError(res, 'Leave request already processed', 400);
      return;
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: {
        status,
        approvedById: req.user!.userId,
        approvedAt: new Date(),
        ...(rejectedReason && { rejectedReason }),
      },
    });

    // Update balance if approved
    if (status === 'APPROVED' && leave.leaveType !== 'UNPAID') {
      const year = leave.startDate.getFullYear();
      await prisma.leaveBalance.updateMany({
        where: { employeeId: leave.employeeId, leaveType: leave.leaveType, year },
        data: {
          used: { increment: leave.days },
          remaining: { decrement: leave.days },
        },
      });
    }

    // Send email
    const dateRange = `${leave.startDate.toDateString()} - ${leave.endDate.toDateString()}`;
    await sendEmail({
      to: leave.employee.user.email,
      subject: `Leave Request ${status}`,
      html: emailTemplates.leaveApproval(
        `${leave.employee.firstName} ${leave.employee.lastName}`,
        status,
        leave.leaveType,
        dateRange
      ),
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: leave.employee.user.id,
        type: status === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
        title: `Leave ${status}`,
        message: `Your ${leave.leaveType} leave request for ${dateRange} has been ${status.toLowerCase()}.`,
      },
    });

    sendSuccess(res, `Leave ${status.toLowerCase()} successfully`, updated);
  } catch (error) { next(error); }
});

// Cancel leave
router.put('/:id/cancel', async (req: AuthRequest, res, next) => {
  try {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!leave) throw new AppError('Leave request not found', 404);
    if (leave.employeeId !== req.user!.employeeId && req.user!.role === 'EMPLOYEE') {
      throw new AppError('Cannot cancel another employee\'s leave', 403);
    }
    if (leave.status !== 'PENDING') {
      sendError(res, 'Can only cancel pending leave requests', 400);
      return;
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });

    sendSuccess(res, 'Leave cancelled', updated);
  } catch (error) { next(error); }
});

export default router;
