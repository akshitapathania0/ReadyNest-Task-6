import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import prisma from '../../config/database';
import { sendSuccess, sendError } from '../../utils/response';
import { AppError } from '../../middlewares/error.middleware';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

const deptSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  headId: z.string().optional(),
});

router.get('/', async (_req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      where: { deletedAt: null },
      include: {
        head: { select: { id: true, firstName: true, lastName: true, profilePhoto: true } },
        _count: { select: { employees: { where: { deletedAt: null, status: 'ACTIVE' } } } },
      },
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, 'Departments retrieved', departments);
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const dept = await prisma.department.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        head: true,
        employees: {
          where: { deletedAt: null, status: 'ACTIVE' },
          include: { user: { select: { email: true } } },
        },
      },
    });
    if (!dept) throw new AppError('Department not found', 404);
    sendSuccess(res, 'Department retrieved', dept);
  } catch (error) { next(error); }
});

router.post('/', authorize('SUPER_ADMIN', 'HR'), async (req, res, next) => {
  try {
    const data = deptSchema.parse(req.body);
    const existing = await prisma.department.findFirst({ where: { name: data.name, deletedAt: null } });
    if (existing) {
      sendError(res, 'Department with this name already exists', 409);
      return;
    }
    const dept = await prisma.department.create({ data, include: { head: true } });
    sendSuccess(res, 'Department created', dept, 201);
  } catch (error) { next(error); }
});

router.put('/:id', authorize('SUPER_ADMIN', 'HR'), async (req, res, next) => {
  try {
    const data = deptSchema.partial().parse(req.body);
    const dept = await prisma.department.update({
      where: { id: req.params.id },
      data,
      include: { head: true },
    });
    sendSuccess(res, 'Department updated', dept);
  } catch (error) { next(error); }
});

router.delete('/:id', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const count = await prisma.employee.count({
      where: { departmentId: req.params.id, deletedAt: null },
    });
    if (count > 0) {
      sendError(res, 'Cannot delete department with active employees', 400);
      return;
    }
    await prisma.department.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    sendSuccess(res, 'Department deleted');
  } catch (error) { next(error); }
});

export default router;
