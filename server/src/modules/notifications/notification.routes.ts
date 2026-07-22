import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import prisma from '../../config/database';
import { sendSuccess, getPaginationParams } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, string>);
    const userId = req.user!.userId;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    sendSuccess(res, 'Notifications', { notifications, unreadCount }, 200, {
      total, page, limit, totalPages: Math.ceil(total / limit),
    });
  } catch (error) { next(error); }
});

router.put('/:id/read', async (req: AuthRequest, res, next) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id, userId: req.user!.userId },
      data: { isRead: true },
    });
    sendSuccess(res, 'Marked as read');
  } catch (error) { next(error); }
});

router.put('/read-all', async (req: AuthRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true },
    });
    sendSuccess(res, 'All notifications marked as read');
  } catch (error) { next(error); }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    await prisma.notification.delete({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    sendSuccess(res, 'Notification deleted');
  } catch (error) { next(error); }
});

export default router;
