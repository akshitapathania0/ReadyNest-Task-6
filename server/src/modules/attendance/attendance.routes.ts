import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import prisma from '../../config/database';
import { sendSuccess, sendError, getPaginationParams } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

// Clock in
router.post('/clock-in', async (req: AuthRequest, res, next) => {
  try {
    const employeeId = req.user!.employeeId!;
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (existing?.clockIn) {
      sendError(res, 'Already clocked in today', 400);
      return;
    }

    const workStart = new Date(today);
    workStart.setHours(9, 0, 0, 0);
    const isLate = now > workStart;

    const attendance = existing
      ? await prisma.attendance.update({
          where: { id: existing.id },
          data: { clockIn: now, isLate, status: 'PRESENT' },
        })
      : await prisma.attendance.create({
          data: { employeeId, date: today, clockIn: now, isLate, status: 'PRESENT' },
        });

    sendSuccess(res, 'Clocked in successfully', attendance, 201);
  } catch (error) { next(error); }
});

// Clock out
router.post('/clock-out', async (req: AuthRequest, res, next) => {
  try {
    const employeeId = req.user!.employeeId!;
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const attendance = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (!attendance?.clockIn) {
      sendError(res, 'Have not clocked in today', 400);
      return;
    }
    if (attendance.clockOut) {
      sendError(res, 'Already clocked out today', 400);
      return;
    }

    const workingMs = now.getTime() - attendance.clockIn.getTime();
    const breakMs = attendance.breakStart && attendance.breakEnd
      ? attendance.breakEnd.getTime() - attendance.breakStart.getTime()
      : 0;
    const netMs = workingMs - breakMs;
    const workingHours = Math.round((netMs / (1000 * 60 * 60)) * 100) / 100;
    const overtime = Math.max(0, workingHours - 8);

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOut: now,
        workingHours,
        breakHours: breakMs / (1000 * 60 * 60),
        overtime,
      },
    });

    sendSuccess(res, 'Clocked out successfully', updated);
  } catch (error) { next(error); }
});

// Break start/end
router.post('/break', async (req: AuthRequest, res, next) => {
  try {
    const employeeId = req.user!.employeeId!;
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const attendance = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (!attendance?.clockIn) {
      sendError(res, 'Not clocked in', 400);
      return;
    }

    const isBreakStart = !attendance.breakStart;

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: isBreakStart ? { breakStart: now } : { breakEnd: now },
    });

    sendSuccess(res, isBreakStart ? 'Break started' : 'Break ended', updated);
  } catch (error) { next(error); }
});

// Today's attendance
router.get('/today', async (req: AuthRequest, res, next) => {
  try {
    const employeeId = req.user!.employeeId!;

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { date: 'desc' },
    });

    sendSuccess(res, 'Today attendance', attendance);
  } catch (error) { next(error); }
});

// My attendance history
router.get('/my', async (req: AuthRequest, res, next) => {
  try {
    const employeeId = req.user!.employeeId!;
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, string>);
    const { month, year } = req.query as Record<string, string>;

    const where: Record<string, unknown> = { employeeId };
    if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      where.date = { gte: start, lte: end };
    }

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({ where, orderBy: { date: 'desc' }, skip, take: limit }),
      prisma.attendance.count({ where }),
    ]);

    sendSuccess(res, 'Attendance history', attendances, 200, {
      total, page, limit, totalPages: Math.ceil(total / limit),
    });
  } catch (error) { next(error); }
});

// All attendance (admin/HR)
router.get('/', authorize('SUPER_ADMIN', 'HR'), async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, string>);
    const { employeeId, date, status } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (date) where.date = new Date(date);
    if (status) where.status = status;

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, employeeId: true, department: true },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ]);

    sendSuccess(res, 'Attendances retrieved', attendances, 200, {
      total, page, limit, totalPages: Math.ceil(total / limit),
    });
  } catch (error) { next(error); }
});

// Edit attendance (admin)
router.put('/:id', authorize('SUPER_ADMIN', 'HR'), async (req: AuthRequest, res, next) => {
  try {
    const { clockIn, clockOut, status, notes } = req.body;
    const updated = await prisma.attendance.update({
      where: { id: req.params.id },
      data: {
        ...(clockIn && { clockIn: new Date(clockIn) }),
        ...(clockOut && { clockOut: new Date(clockOut) }),
        ...(status && { status }),
        ...(notes && { notes }),
        editedBy: req.user!.userId,
      },
    });
    sendSuccess(res, 'Attendance updated', updated);
  } catch (error) { next(error); }
});

// Monthly report
router.get('/report/monthly', async (req: AuthRequest, res, next) => {
  try {
    const employeeId = req.user!.role === 'EMPLOYEE'
      ? req.user!.employeeId!
      : (req.query.employeeId as string) || req.user!.employeeId!;

    const month = parseInt(req.query.month as string || String(new Date().getMonth() + 1));
    const year = parseInt(req.query.year as string || String(new Date().getFullYear()));

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const attendances = await prisma.attendance.findMany({
      where: { employeeId, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    });

    const summary = {
      total: attendances.length,
      present: attendances.filter(a => a.status === 'PRESENT').length,
      absent: attendances.filter(a => a.status === 'ABSENT').length,
      late: attendances.filter(a => a.isLate).length,
      onLeave: attendances.filter(a => a.status === 'ON_LEAVE').length,
      totalWorkingHours: attendances.reduce((sum, a) => sum + Number(a.workingHours || 0), 0),
      totalOvertime: attendances.reduce((sum, a) => sum + Number(a.overtime || 0), 0),
    };

    sendSuccess(res, 'Monthly report', { attendances, summary });
  } catch (error) { next(error); }
});

export default router;