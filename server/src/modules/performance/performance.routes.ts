import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import prisma from '../../config/database';
import { sendSuccess, getPaginationParams } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

const reviewSchema = z.object({
  employeeId: z.string(),
  period: z.string(),
  year: z.number(),
  rating: z.number().min(1).max(5),
  feedback: z.string().min(10),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
  goals: z.any().optional(),
  promotionRecommended: z.boolean().optional(),
});

router.get('/', authorize('SUPER_ADMIN', 'HR'), async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, string>);
    const { employeeId, year } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (year) where.year = parseInt(year);

    const [reviews, total] = await Promise.all([
      prisma.performanceReview.findMany({
        where,
        include: {
          employee: { select: { firstName: true, lastName: true, profilePhoto: true, designation: true } },
          reviewer: { select: { firstName: true, lastName: true, profilePhoto: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      prisma.performanceReview.count({ where }),
    ]);

    sendSuccess(res, 'Performance reviews', reviews, 200, {
      total, page, limit, totalPages: Math.ceil(total / limit),
    });
  } catch (error) { next(error); }
});

router.get('/my', async (req: AuthRequest, res, next) => {
  try {
    const employeeId = req.user!.employeeId!;
    const reviews = await prisma.performanceReview.findMany({
      where: { employeeId },
      include: {
        reviewer: { select: { firstName: true, lastName: true, profilePhoto: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, 'My reviews', reviews);
  } catch (error) { next(error); }
});

router.post('/', authorize('SUPER_ADMIN', 'HR'), async (req: AuthRequest, res, next) => {
  try {
    const data = reviewSchema.parse(req.body);
    const reviewerEmployee = await prisma.employee.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!reviewerEmployee) throw new AppError('Reviewer employee record not found', 404);

    const review = await prisma.performanceReview.create({
      data: {
        ...data,
        reviewerId: reviewerEmployee.id,
      },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        reviewer: { select: { firstName: true, lastName: true } },
      },
    });

    // Notify employee
    const emp = await prisma.employee.findUnique({
      where: { id: data.employeeId },
      include: { user: true },
    });
    if (emp) {
      await prisma.notification.create({
        data: {
          userId: emp.user.id,
          type: 'PERFORMANCE_REVIEW',
          title: 'Performance Review Added',
          message: `Your performance review for ${data.period} ${data.year} has been submitted.`,
        },
      });
    }

    sendSuccess(res, 'Review created', review, 201);
  } catch (error) { next(error); }
});

router.put('/:id', authorize('SUPER_ADMIN', 'HR'), async (req, res, next) => {
  try {
    const data = reviewSchema.partial().parse(req.body);
    const review = await prisma.performanceReview.update({
      where: { id: req.params.id },
      data,
    });
    sendSuccess(res, 'Review updated', review);
  } catch (error) { next(error); }
});

export default router;
