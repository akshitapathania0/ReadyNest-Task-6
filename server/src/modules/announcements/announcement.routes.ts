import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import prisma from '../../config/database';
import { sendSuccess, getPaginationParams } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../middlewares/error.middleware';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  isPinned: z.boolean().optional(),
  targetRoles: z.array(z.string()).optional(),
  expiresAt: z.string().optional(),
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, string>);

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where: {
          deletedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip, take: limit,
      }),
      prisma.announcement.count({
        where: {
          deletedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }),
    ]);

    sendSuccess(res, 'Announcements', announcements, 200, {
      total, page, limit, totalPages: Math.ceil(total / limit),
    });
  } catch (error) { next(error); }
});

router.post('/', authorize('SUPER_ADMIN', 'HR'), async (req: AuthRequest, res, next) => {
  try {
    const data = announcementSchema.parse(req.body);
    const announcement = await prisma.announcement.create({
      data: {
        ...data,
        createdById: req.user!.userId,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
    sendSuccess(res, 'Announcement created', announcement, 201);
  } catch (error) { next(error); }
});

router.put('/:id', authorize('SUPER_ADMIN', 'HR'), async (req, res, next) => {
  try {
    const data = announcementSchema.partial().parse(req.body);
    const announcement = await prisma.announcement.update({
      where: { id: req.params.id },
      data: {
        ...data,
        ...(data.expiresAt && { expiresAt: new Date(data.expiresAt) }),
      },
    });
    sendSuccess(res, 'Announcement updated', announcement);
  } catch (error) { next(error); }
});

router.delete('/:id', authorize('SUPER_ADMIN', 'HR'), async (req, res, next) => {
  try {
    await prisma.announcement.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    sendSuccess(res, 'Announcement deleted');
  } catch (error) { next(error); }
});

router.post('/:id/read', async (req: AuthRequest, res, next) => {
  try {
    const announcement = await prisma.announcement.findUnique({ where: { id: req.params.id } });
    if (!announcement) throw new AppError('Announcement not found', 404);

    const readBy = (announcement.readBy as string[] | null) || [];
    if (!readBy.includes(req.user!.userId)) {
      readBy.push(req.user!.userId);
      await prisma.announcement.update({
        where: { id: req.params.id },
        data: { readBy },
      });
    }
    sendSuccess(res, 'Marked as read');
  } catch (error) { next(error); }
});

export default router;
