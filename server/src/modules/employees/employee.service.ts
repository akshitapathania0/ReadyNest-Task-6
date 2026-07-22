import { EmploymentStatus, Prisma } from '@prisma/client';
import { employeeRepository, EmployeeFilters } from './employee.repository';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/upload';
import { AppError } from '../../middlewares/error.middleware';
import prisma from '../../config/database';

export const employeeService = {
  getAllEmployees: async (filters: EmployeeFilters) => {
    return employeeRepository.findAll(filters);
  },

  getEmployeeById: async (id: string) => {
    const employee = await employeeRepository.findById(id);
    if (!employee) throw new AppError('Employee not found', 404);
    return employee;
  },

  getMyProfile: async (employeeId: string) => {
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) throw new AppError('Profile not found', 404);
    return employee;
  },

  updateEmployee: async (
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      gender: string;
      dateOfBirth: string;
      address: string;
      city: string;
      state: string;
      country: string;
      departmentId: string;
      designation: string;
      salary: number;
      status: EmploymentStatus;
      managerId: string;
      emergencyName: string;
      emergencyPhone: string;
      emergencyRelation: string;
    }>,
    requestorRole: string,
    requestorEmployeeId?: string
  ) => {
    const employee = await employeeRepository.findById(id);
    if (!employee) throw new AppError('Employee not found', 404);

    // Employees can only update their own profile and limited fields
    if (requestorRole === 'EMPLOYEE') {
      if (requestorEmployeeId !== id) {
        throw new AppError('Cannot update another employee\'s profile', 403);
      }
      const allowedFields = ['phone', 'address', 'city', 'state', 'country', 'emergencyName', 'emergencyPhone', 'emergencyRelation'];
      const updateData: Prisma.EmployeeUpdateInput = {};
      for (const field of allowedFields) {
        if (field in data) {
          (updateData as Record<string, unknown>)[field] = (data as Record<string, unknown>)[field];
        }
      }
      return employeeRepository.update(id, updateData);
    }

    const updateData: Prisma.EmployeeUpdateInput = {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.gender && { gender: data.gender as never }),
      ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.state !== undefined && { state: data.state }),
      ...(data.country !== undefined && { country: data.country }),
      ...(data.departmentId && { department: { connect: { id: data.departmentId } } }),
      ...(data.designation !== undefined && { designation: data.designation }),
      ...(data.salary !== undefined && { salary: data.salary }),
      ...(data.status && { status: data.status }),
      ...(data.managerId && { manager: { connect: { id: data.managerId } } }),
      ...(data.emergencyName !== undefined && { emergencyName: data.emergencyName }),
      ...(data.emergencyPhone !== undefined && { emergencyPhone: data.emergencyPhone }),
      ...(data.emergencyRelation !== undefined && { emergencyRelation: data.emergencyRelation }),
    };

    return employeeRepository.update(id, updateData);
  },

  uploadProfilePhoto: async (id: string, buffer: Buffer) => {
    const employee = await employeeRepository.findById(id);
    if (!employee) throw new AppError('Employee not found', 404);

    // Delete old photo if exists
    if (employee.profilePhoto) {
      const publicId = employee.profilePhoto.split('/').pop()?.split('.')[0];
      if (publicId) await deleteFromCloudinary(`hrms/profiles/${publicId}`);
    }

    const result = await uploadToCloudinary(buffer, 'profiles', 'image');
    return employeeRepository.update(id, { profilePhoto: result.secure_url });
  },

  uploadDocument: async (employeeId: string, file: Express.Multer.File, name: string, type: string) => {
    const result = await uploadToCloudinary(file.buffer, 'documents');
    return prisma.document.create({
      data: {
        employeeId,
        name,
        type,
        url: result.secure_url,
        publicId: result.public_id,
        size: file.size,
      },
    });
  },

  deleteEmployee: async (id: string) => {
    const employee = await employeeRepository.findById(id);
    if (!employee) throw new AppError('Employee not found', 404);
    return employeeRepository.softDelete(id);
  },
};
