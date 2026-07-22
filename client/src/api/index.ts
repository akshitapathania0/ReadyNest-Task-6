import api from './client';
import { ApiResponse, Employee, Department, Attendance, LeaveRequest, LeaveBalance, Payroll, PerformanceReview, Announcement, Notification, User } from '../types';

// Auth
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get<ApiResponse<User>>('/auth/me'),
  register: (data: Record<string, unknown>) => api.post<ApiResponse<User>>('/auth/register', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) => api.post('/auth/reset-password', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
};

// Employees
export const employeeApi = {
  getAll: (params?: Record<string, unknown>) => api.get<ApiResponse<Employee[]>>('/employees', { params }),
  getById: (id: string) => api.get<ApiResponse<Employee>>(`/employees/${id}`),
  getMe: () => api.get<ApiResponse<Employee>>('/employees/me'),
  update: (id: string, data: Partial<Employee>) => api.put<ApiResponse<Employee>>(`/employees/${id}`, data),
  uploadPhoto: (id: string, file: File) => {
    const form = new FormData();
    form.append('photo', file);
    return api.post<ApiResponse<{ profilePhoto: string }>>(`/employees/${id}/photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadDocument: (id: string, file: File, name: string, type: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('name', name);
    form.append('type', type);
    return api.post(`/employees/${id}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id: string) => api.delete(`/employees/${id}`),
};

// Departments
export const departmentApi = {
  getAll: () => api.get<ApiResponse<Department[]>>('/departments'),
  getById: (id: string) => api.get<ApiResponse<Department>>(`/departments/${id}`),
  create: (data: { name: string; description?: string; headId?: string }) =>
    api.post<ApiResponse<Department>>('/departments', data),
  update: (id: string, data: Partial<Department>) =>
    api.put<ApiResponse<Department>>(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
};

// Attendance
export const attendanceApi = {
  clockIn: () => api.post<ApiResponse<Attendance>>('/attendance/clock-in'),
  clockOut: () => api.post<ApiResponse<Attendance>>('/attendance/clock-out'),
  toggleBreak: () => api.post<ApiResponse<Attendance>>('/attendance/break'),
  getToday: () => api.get<ApiResponse<Attendance>>('/attendance/today'),
  getMy: (params?: Record<string, unknown>) => api.get<ApiResponse<Attendance[]>>('/attendance/my', { params }),
  getAll: (params?: Record<string, unknown>) => api.get<ApiResponse<Attendance[]>>('/attendance', { params }),
  update: (id: string, data: Partial<Attendance>) => api.put<ApiResponse<Attendance>>(`/attendance/${id}`, data),
  getMonthlyReport: (params?: Record<string, unknown>) =>
    api.get('/attendance/report/monthly', { params }),
};

// Leave
export const leaveApi = {
  getBalances: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<LeaveBalance[]>>('/leaves/balances', { params }),
  apply: (data: Record<string, unknown>) => api.post<ApiResponse<LeaveRequest>>('/leaves', data),
  getMy: (params?: Record<string, unknown>) => api.get<ApiResponse<LeaveRequest[]>>('/leaves/my', { params }),
  getAll: (params?: Record<string, unknown>) => api.get<ApiResponse<LeaveRequest[]>>('/leaves', { params }),
  updateStatus: (id: string, data: { status: string; rejectedReason?: string }) =>
    api.put(`/leaves/${id}/status`, data),
  cancel: (id: string) => api.put(`/leaves/${id}/cancel`),
};

// Payroll
export const payrollApi = {
  generate: (data: Record<string, unknown>) => api.post<ApiResponse<Payroll>>('/payroll/generate', data),
  generateBulk: (data: { month: number; year: number }) => api.post('/payroll/generate-bulk', data),
  getAll: (params?: Record<string, unknown>) => api.get<ApiResponse<Payroll[]>>('/payroll', { params }),
  getMy: (params?: Record<string, unknown>) => api.get<ApiResponse<Payroll[]>>('/payroll/my', { params }),
  markPaid: (id: string) => api.put(`/payroll/${id}/pay`),
};

// Performance
export const performanceApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<PerformanceReview[]>>('/performance', { params }),
  getMy: () => api.get<ApiResponse<PerformanceReview[]>>('/performance/my'),
  create: (data: Record<string, unknown>) => api.post<ApiResponse<PerformanceReview>>('/performance', data),
  update: (id: string, data: Partial<PerformanceReview>) =>
    api.put<ApiResponse<PerformanceReview>>(`/performance/${id}`, data),
};

// Announcements
export const announcementApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<Announcement[]>>('/announcements', { params }),
  create: (data: Record<string, unknown>) => api.post<ApiResponse<Announcement>>('/announcements', data),
  update: (id: string, data: Partial<Announcement>) =>
    api.put<ApiResponse<Announcement>>(`/announcements/${id}`, data),
  delete: (id: string) => api.delete(`/announcements/${id}`),
  markRead: (id: string) => api.post(`/announcements/${id}/read`),
};

// Notifications
export const notificationApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<{ notifications: Notification[]; unreadCount: number }>>('/notifications', { params }),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// Dashboard
export const dashboardApi = {
  getAdminStats: () => api.get('/dashboard/admin'),
  getEmployeeStats: () => api.get('/dashboard/employee'),
};

// Reports
export const reportsApi = {
  getEmployees: (params?: Record<string, unknown>) => api.get('/reports/employees', { params }),
  getAttendance: (params?: Record<string, unknown>) => api.get('/reports/attendance', { params }),
  getPayroll: (params?: Record<string, unknown>) => api.get('/reports/payroll', { params }),
  getLeaves: (params?: Record<string, unknown>) => api.get('/reports/leaves', { params }),
};
