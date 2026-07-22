import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { employeeService } from './employee.service';
import { sendSuccess } from '../../utils/response';
import { getPaginationParams } from '../../utils/response';
import { EmploymentStatus } from '@prisma/client';

export const employeeController = {
  getAll: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = getPaginationParams(req.query as Record<string, string>);
      const { search, departmentId, status, sortBy, sortOrder } = req.query as Record<string, string>;

      const { employees, total } = await employeeService.getAllEmployees({
        search, departmentId,
        status: status as EmploymentStatus,
        page, limit,
        sortBy, sortOrder: sortOrder as 'asc' | 'desc',
      });

      sendSuccess(res, 'Employees retrieved', employees, 200, {
        total, page, limit, totalPages: Math.ceil(total / limit),
      });
    } catch (error) { next(error); }
  },

  getById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const employee = await employeeService.getEmployeeById(req.params.id);
      sendSuccess(res, 'Employee retrieved', employee);
    } catch (error) { next(error); }
  },

  getMyProfile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const employee = await employeeService.getMyProfile(req.user!.employeeId!);
      sendSuccess(res, 'Profile retrieved', employee);
    } catch (error) { next(error); }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const employee = await employeeService.updateEmployee(
        req.params.id,
        req.body,
        req.user!.role,
        req.user!.employeeId
      );
      sendSuccess(res, 'Employee updated', employee);
    } catch (error) { next(error); }
  },

  uploadPhoto: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }
      const id = req.params.id || req.user!.employeeId!;
      const employee = await employeeService.uploadProfilePhoto(id, req.file.buffer);
      sendSuccess(res, 'Profile photo updated', { profilePhoto: employee.profilePhoto });
    } catch (error) { next(error); }
  },

  uploadDocument: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }
      const { name, type } = req.body;
      const document = await employeeService.uploadDocument(
        req.params.id,
        req.file,
        name || req.file.originalname,
        type || 'DOCUMENT'
      );
      sendSuccess(res, 'Document uploaded', document, 201);
    } catch (error) { next(error); }
  },

  delete: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await employeeService.deleteEmployee(req.params.id);
      sendSuccess(res, 'Employee deleted');
    } catch (error) { next(error); }
  },
};
