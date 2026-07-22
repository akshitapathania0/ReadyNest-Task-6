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

const payrollSchema = z.object({
  employeeId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  bonus: z.number().min(0).default(0),
  allowances: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
});

// Calculate payroll
const calculatePayroll = async (
  employeeId: string, month: number, year: number,
  bonus: number, allowances: number, deductions: number
) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { user: true },
  });
  if (!employee) throw new AppError('Employee not found', 404);

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  const workingDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId,
      date: { gte: start, lte: end },
      status: { in: ['PRESENT', 'HALF_DAY'] },
    },
  });

  const presentDays = attendances.length;
  const overtimeHours = attendances.reduce((sum, a) => sum + Number(a.overtime || 0), 0);

  const basicSalary = Number(employee.salary);
  const dailyRate = basicSalary / workingDays;
  const earnedSalary = dailyRate * presentDays;
  const overtimePay = (dailyRate / 8) * 1.5 * overtimeHours;

  const taxableIncome = earnedSalary + bonus + allowances + overtimePay - deductions;
  const tax = taxableIncome > 0 ? taxableIncome * 0.1 : 0; // 10% tax
  const netSalary = taxableIncome - tax;

  return {
    basicSalary: earnedSalary,
    bonus, allowances, deductions,
    tax, overtimeHours, overtimePay,
    workingDays, presentDays,
    netSalary: Math.max(0, netSalary),
    employee,
  };
};

// Generate payroll
router.post('/generate', authorize('SUPER_ADMIN', 'HR'), async (req, res, next) => {
  try {
    const data = payrollSchema.parse(req.body);
    const { employee, ...payData } = await calculatePayroll(
      data.employeeId, data.month, data.year,
      data.bonus, data.allowances, data.deductions
    );

    const existing = await prisma.payroll.findUnique({
      where: { employeeId_month_year: { employeeId: data.employeeId, month: data.month, year: data.year } },
    });

    if (existing) {
      sendError(res, 'Payroll already generated for this period', 409);
      return;
    }

    const payroll = await prisma.payroll.create({
      data: {
        employeeId: data.employeeId,
        month: data.month,
        year: data.year,
        ...payData,
      },
      include: { employee: { include: { user: true } } },
    });

    sendSuccess(res, 'Payroll generated', payroll, 201);
  } catch (error) { next(error); }
});

// Bulk generate for all employees
router.post('/generate-bulk', authorize('SUPER_ADMIN', 'HR'), async (req: AuthRequest, res, next) => {
  try {
    const { month, year } = req.body;
    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      include: { user: true },
    });

    const results = [];
    for (const emp of employees) {
      try {
        const existing = await prisma.payroll.findUnique({
          where: { employeeId_month_year: { employeeId: emp.id, month, year } },
        });
        if (existing) continue;

        const { employee: _, ...payData } = await calculatePayroll(emp.id, month, year, 0, 0, 0);
        const payroll = await prisma.payroll.create({
          data: { employeeId: emp.id, month, year, ...payData },
        });
        results.push(payroll);

        // Notify employee
        await prisma.notification.create({
          data: {
            userId: emp.user.id,
            type: 'PAYROLL_GENERATED',
            title: 'Payslip Ready',
            message: `Your payslip for ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year} is ready.`,
          },
        });

        await sendEmail({
          to: emp.user.email,
          subject: 'Payslip Generated',
          html: emailTemplates.payrollGenerated(
            `${emp.firstName} ${emp.lastName}`,
            `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`,
            `₹${payData.netSalary.toFixed(2)}`
          ),
        });
      } catch {}
    }

    sendSuccess(res, `Payroll generated for ${results.length} employees`, results);
  } catch (error) { next(error); }
});

// Get all payrolls
router.get('/', authorize('SUPER_ADMIN', 'HR'), async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, string>);
    const { month, year, employeeId, status } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true, firstName: true, lastName: true,
              employeeId: true, designation: true, department: true,
            },
          },
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip, take: limit,
      }),
      prisma.payroll.count({ where }),
    ]);

    sendSuccess(res, 'Payrolls retrieved', payrolls, 200, {
      total, page, limit, totalPages: Math.ceil(total / limit),
    });
  } catch (error) { next(error); }
});

// Get my payrolls
router.get('/my', async (req: AuthRequest, res, next) => {
  try {
    const employeeId = req.user!.employeeId!;
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, string>);

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where: { employeeId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip, take: limit,
      }),
      prisma.payroll.count({ where: { employeeId } }),
    ]);

    sendSuccess(res, 'My payrolls', payrolls, 200, {
      total, page, limit, totalPages: Math.ceil(total / limit),
    });
  } catch (error) { next(error); }
});

// Mark as paid
router.put('/:id/pay', authorize('SUPER_ADMIN', 'HR'), async (req, res, next) => {
  try {
    const payroll = await prisma.payroll.update({
      where: { id: req.params.id },
      data: { status: 'PAID', paidAt: new Date() },
      include: { employee: { include: { user: true } } },
    });
    sendSuccess(res, 'Payroll marked as paid', payroll);
  } catch (error) { next(error); }
});

export default router;
