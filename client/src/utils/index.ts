import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatCurrency = (amount: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-IN', options || { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));

export const formatTime = (date: string | Date) =>
  new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(date));

export const formatDateTime = (date: string | Date) =>
  `${formatDate(date)} ${formatTime(date)}`;

export const getInitials = (firstName: string, lastName: string) =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

export const getMonthName = (month: number) =>
  new Date(2024, month - 1).toLocaleString('default', { month: 'long' });

export const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: getMonthName(i + 1),
}));

export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    ACTIVE: 'badge-green',
    INACTIVE: 'badge-gray',
    TERMINATED: 'badge-red',
    ON_LEAVE: 'badge-yellow',
    PROBATION: 'badge-blue',
    PRESENT: 'badge-green',
    ABSENT: 'badge-red',
    LATE: 'badge-yellow',
    HALF_DAY: 'badge-blue',
    APPROVED: 'badge-green',
    REJECTED: 'badge-red',
    PENDING: 'badge-yellow',
    CANCELLED: 'badge-gray',
    PAID: 'badge-green',
    DRAFT: 'badge-gray',
    PROCESSING: 'badge-blue',
    FAILED: 'badge-red',
  };
  return map[status] || 'badge-gray';
};

export const LEAVE_TYPE_COLORS: Record<string, string> = {
  SICK: 'badge-red',
  CASUAL: 'badge-blue',
  PAID: 'badge-green',
  WORK_FROM_HOME: 'badge-purple',
  MATERNITY: 'badge-yellow',
  PATERNITY: 'badge-yellow',
  UNPAID: 'badge-gray',
};

export const downloadCSV = (data: Record<string, unknown>[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
