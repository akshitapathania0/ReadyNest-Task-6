import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import employeeRoutes from '../modules/employees/employee.routes';
import departmentRoutes from '../modules/departments/department.routes';
import attendanceRoutes from '../modules/attendance/attendance.routes';
import leaveRoutes from '../modules/leave/leave.routes';
import payrollRoutes from '../modules/payroll/payroll.routes';
import performanceRoutes from '../modules/performance/performance.routes';
import announcementRoutes from '../modules/announcements/announcement.routes';
import notificationRoutes from '../modules/notifications/notification.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import reportRoutes from '../modules/reports/reports.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/departments', departmentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/payroll', payrollRoutes);
router.use('/performance', performanceRoutes);
router.use('/announcements', announcementRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

export default router;
