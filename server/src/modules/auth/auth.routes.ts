import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { logActivity } from '../../middlewares/activity.middleware';

const router = Router();

router.post('/login', logActivity('LOGIN'), authController.login);
router.post('/register', authenticate, authorize('SUPER_ADMIN', 'HR'), logActivity('REGISTER_EMPLOYEE', 'Employee'), authController.register);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, logActivity('LOGOUT'), authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.put('/change-password', authenticate, authController.changePassword);
router.get('/me', authenticate, authController.getMe);

export default router;
