import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import prisma from '../../config/database';
import { sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

// Admin/HR dashboard stats
router.get('/admin', authorize('SUPER_ADMIN', 'HR'), async (_req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalEmployees,
      totalDepartments,
      todayAttendance,
      pendingLeaves,
      activeEmployees,
      newThisMonth,
    ] = await Promise.all([
      prisma.employee.count({ where: { deletedAt: null } }),
      prisma.department.count({ where: { deletedAt: null } }),
      prisma.attendance.count({ where: { date: today, status: 'PRESENT' } }),
      prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      prisma.employee.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.employee.count({
        where: {
          joiningDate: {
            gte: new Date(today.getFullYear(), today.getMonth(), 1),
          },
          deletedAt: null,
        },
      }),
    ]);

    // Attendance last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const [present, absent, late] = await Promise.all([
        prisma.attendance.count({ where: { date: { gte: date, lt: nextDay }, status: 'PRESENT' } }),
        prisma.attendance.count({ where: { date: { gte: date, lt: nextDay }, status: 'ABSENT' } }),
        prisma.attendance.count({ where: { date: { gte: date, lt: nextDay }, isLate: true } }),
      ]);

      last7Days.push({
        date: date.toISOString().split('T')[0],
        present, absent, late,
      });
    }

    // Department distribution
    const deptStats = await prisma.department.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { employees: { where: { deletedAt: null, status: 'ACTIVE' } } } },
      },
    });

    // Monthly payroll for current year
    const currentYear = today.getFullYear();
    const monthlyPayroll = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        prisma.payroll.aggregate({
          where: { month: i + 1, year: currentYear, status: 'PAID' },
          _sum: { netSalary: true },
        }).then(r => ({
          month: i + 1,
          total: Number(r._sum.netSalary || 0),
        }))
      )
    );

    // Recent leaves
    const recentLeaves = await prisma.leaveRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        employee: {
          select: { firstName: true, lastName: true, profilePhoto: true, designation: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Leave type distribution
    const leaveStats = await prisma.leaveRequest.groupBy({
      by: ['leaveType'],
      where: { createdAt: { gte: new Date(currentYear, 0, 1) } },
      _count: true,
    });

    sendSuccess(res, 'Admin dashboard', {
      stats: {
        totalEmployees,
        totalDepartments,
        todayAttendance,
        pendingLeaves,
        activeEmployees,
        newThisMonth,
        attendanceRate: totalEmployees > 0
          ? Math.round((todayAttendance / activeEmployees) * 100)
          : 0,
      },
      charts: {
        attendanceTrend: last7Days,
        departmentDistribution: deptStats.map(d => ({
          name: d.name,
          count: d._count.employees,
        })),
        monthlyPayroll,
        leaveDistribution: leaveStats,
      },
      recentLeaves,
    });
  } catch (error) { next(error); }
});

// Employee dashboard
router.get('/employee', async (req: AuthRequest, res, next) => {
  try {
    const employeeId = req.user!.employeeId!;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    const [
      todayAttendance,
      leaveBalances,
      recentPayrolls,
      announcements,
      pendingLeaves,
    ] = await Promise.all([
      prisma.attendance.findUnique({
        where: { employeeId_date: { employeeId, date: today } },
      }),
      prisma.leaveBalance.findMany({
        where: { employeeId, year },
      }),
      prisma.payroll.findMany({
        where: { employeeId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 3,
      }),
      prisma.announcement.findMany({
        where: { deletedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        take: 5,
      }),
      prisma.leaveRequest.findMany({
        where: { employeeId, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ]);

    // Monthly attendance summary
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const monthAttendance = await prisma.attendance.findMany({
      where: { employeeId, date: { gte: monthStart, lte: monthEnd } },
    });

    const attendanceSummary = {
      present: monthAttendance.filter(a => a.status === 'PRESENT').length,
      absent: monthAttendance.filter(a => a.status === 'ABSENT').length,
      late: monthAttendance.filter(a => a.isLate).length,
      totalHours: monthAttendance.reduce((s, a) => s + Number(a.workingHours || 0), 0),
    };

    sendSuccess(res, 'Employee dashboard', {
      todayAttendance,
      leaveBalances,
      recentPayrolls,
      announcements,
      pendingLeaves,
      attendanceSummary,
    });
  } catch (error) { next(error); }
});

export default router;
