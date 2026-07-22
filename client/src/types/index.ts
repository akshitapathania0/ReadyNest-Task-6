export type Role = 'SUPER_ADMIN' | 'HR' | 'EMPLOYEE';
export type EmploymentStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE' | 'PROBATION';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEKEND';
export type LeaveType = 'SICK' | 'CASUAL' | 'PAID' | 'WORK_FROM_HOME' | 'MATERNITY' | 'PATERNITY' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type PayrollStatus = 'DRAFT' | 'PROCESSING' | 'PAID' | 'FAILED';
export type NotificationType = 'LEAVE_APPLIED' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'PAYROLL_GENERATED' | 'ATTENDANCE_REMINDER' | 'ANNOUNCEMENT' | 'PERFORMANCE_REVIEW' | 'GENERAL';

export interface User {
  id: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
  employee?: Employee;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  headId?: string;
  head?: Partial<Employee>;
  _count?: { employees: number };
  createdAt: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  profilePhoto?: string;
  departmentId?: string;
  department?: Department;
  designation?: string;
  joiningDate: string;
  salary: number;
  status: EmploymentStatus;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  managerId?: string;
  manager?: Partial<Employee>;
  user?: Partial<User>;
  leaveBalances?: LeaveBalance[];
  createdAt: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employee?: Partial<Employee>;
  date: string;
  clockIn?: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  workingHours?: number;
  breakHours?: number;
  status: AttendanceStatus;
  isLate: boolean;
  overtime?: number;
  notes?: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  year: number;
  total: number;
  used: number;
  remaining: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee?: Partial<Employee>;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  approvedById?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
}

export interface Payroll {
  id: string;
  employeeId: string;
  employee?: Partial<Employee>;
  month: number;
  year: number;
  basicSalary: number;
  bonus: number;
  allowances: number;
  deductions: number;
  tax: number;
  netSalary: number;
  workingDays: number;
  presentDays: number;
  overtimeHours: number;
  overtimePay: number;
  status: PayrollStatus;
  paidAt?: string;
  createdAt: string;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employee?: Partial<Employee>;
  reviewerId: string;
  reviewer?: Partial<Employee>;
  period: string;
  year: number;
  rating: number;
  feedback: string;
  strengths?: string;
  improvements?: string;
  promotionRecommended: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdById: string;
  readBy?: string[];
  expiresAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
