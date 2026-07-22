import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import prisma from '../../config/database';
import { sendSuccess } from '../../utils/response';

const router = Router();
router.use(authenticate, authorize('SUPER_ADMIN', 'HR'));

router.get('/employees', async (req, res, next) => {
  try {
    const { departmentId, status, startDate, endDate } = req.query as Record<string, string>;
    const where: Record<string, unknown> = { deletedAt: null };
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    if (startDate && endDate) {
      where.joiningDate = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        user: { select: { email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, 'Employee report', employees);
  } catch (error) { next(error); }
});

router.get('/attendance', async (req, res, next) => {
  try {
    const { month, year, departmentId } = req.query as Record<string, string>;
    const m = parseInt(month || String(new Date().getMonth() + 1));
    const y = parseInt(year || String(new Date().getFullYear()));

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);

    const where: Record<string, unknown> = { date: { gte: start, lte: end } };
    if (departmentId) {
      where.employee = { departmentId };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            firstName: true, lastName: true, employeeId: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    const summary = {
      total: attendances.length,
      present: attendances.filter(a => a.status === 'PRESENT').length,
      absent: attendances.filter(a => a.status === 'ABSENT').length,
      late: attendances.filter(a => a.isLate).length,
      avgWorkingHours: attendances.length
        ? attendances.reduce((s, a) => s + Number(a.workingHours || 0), 0) / attendances.length
        : 0,
    };

    sendSuccess(res, 'Attendance report', { attendances, summary });
  } catch (error) { next(error); }
});

router.get('/payroll', async (req, res, next) => {
  try {
    const { month, year, departmentId } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (departmentId) where.employee = { departmentId };

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        employee: {
          select: {
            firstName: true, lastName: true, employeeId: true,
            designation: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    const summary = {
      total: payrolls.length,
      totalPaid: payrolls.reduce((s, p) => s + Number(p.netSalary), 0),
      avgSalary: payrolls.length
        ? payrolls.reduce((s, p) => s + Number(p.netSalary), 0) / payrolls.length
        : 0,
    };

    sendSuccess(res, 'Payroll report', { payrolls, summary });
  } catch (error) { next(error); }
});

router.get('/leaves', async (req, res, next) => {
  try {
    const { year, status, leaveType } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (leaveType) where.leaveType = leaveType;
    if (year) {
      where.startDate = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      };
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            firstName: true, lastName: true, employeeId: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      total: leaves.length,
      approved: leaves.filter(l => l.status === 'APPROVED').length,
      pending: leaves.filter(l => l.status === 'PENDING').length,
      rejected: leaves.filter(l => l.status === 'REJECTED').length,
    };

    sendSuccess(res, 'Leave report', { leaves, summary });
  } catch (error) { next(error); }
});

export default router;
