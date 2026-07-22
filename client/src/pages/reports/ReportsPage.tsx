import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText, Users, Clock, DollarSign, CalendarOff } from 'lucide-react';
import { reportsApi, departmentApi } from '../../api';
import { Button, Card, Select, Skeleton } from '../../components/ui';
import { formatCurrency, formatDate, MONTHS, CURRENT_YEAR, YEARS, downloadCSV } from '../../utils';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const REPORT_TYPES = [
  { value: 'employees', label: 'Employee Report', icon: <Users size={16} /> },
  { value: 'attendance', label: 'Attendance Report', icon: <Clock size={16} /> },
  { value: 'payroll', label: 'Payroll Report', icon: <DollarSign size={16} /> },
  { value: 'leaves', label: 'Leave Report', icon: <CalendarOff size={16} /> },
];

const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('attendance');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [deptFilter, setDeptFilter] = useState('');

  const { data: depts } = useQuery({ queryKey: ['departments'], queryFn: () => departmentApi.getAll() });

  const { data, isLoading } = useQuery({
    queryKey: ['reports', reportType, { month, year, deptFilter }],
    queryFn: () => {
      const params = { month, year, departmentId: deptFilter || undefined };
      if (reportType === 'employees') return reportsApi.getEmployees({ departmentId: deptFilter || undefined });
      if (reportType === 'attendance') return reportsApi.getAttendance(params);
      if (reportType === 'payroll') return reportsApi.getPayroll({ month, year, departmentId: deptFilter || undefined });
      return reportsApi.getLeaves({ year });
    },
  });

  const reportData = data?.data?.data;
  const departments = depts?.data?.data || [];

  const handleExport = () => {
    const rows = reportType === 'attendance'
      ? (reportData?.attendances || []).map((a: Record<string, unknown>) => ({
          Employee: `${(a.employee as { firstName?: string })?.firstName} ${(a.employee as { lastName?: string })?.lastName}`,
          Date: formatDate(a.date as string),
          Status: a.status,
          WorkingHours: a.workingHours,
        }))
      : reportType === 'payroll'
      ? (reportData?.payrolls || []).map((p: Record<string, unknown>) => ({
          Employee: `${(p.employee as { firstName?: string })?.firstName} ${(p.employee as { lastName?: string })?.lastName}`,
          Month: p.month, Year: p.year,
          NetSalary: p.netSalary, Status: p.status,
        }))
      : (reportData || []).map((e: Record<string, unknown>) => ({
          Name: `${e.firstName} ${e.lastName}`,
          Department: (e.department as { name?: string })?.name,
          Status: e.status,
          Designation: e.designation,
        }));

    downloadCSV(rows, `${reportType}-report-${month}-${year}`);
  };

  const summary = reportData?.summary;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Analytics and data exports</p>
        </div>
        <Button variant="secondary" leftIcon={<Download size={16} />} onClick={handleExport}>Export CSV</Button>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {REPORT_TYPES.map(r => (
          <button key={r.value} onClick={() => setReportType(r.value)}
            className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
              reportType === r.value
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary-300'
            }`}>
            {r.icon} {r.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3">
          {(reportType === 'attendance' || reportType === 'payroll') && (
            <Select options={MONTHS} value={month} onChange={e => setMonth(Number(e.target.value))}
              className="w-36" />
          )}
          <Select options={YEARS.map(y => ({ value: y, label: String(y) }))} value={year}
            onChange={e => setYear(Number(e.target.value))} className="w-28" />
          {reportType !== 'leaves' && (
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="input w-48">
              <option value="">All Departments</option>
              {departments.map((d: { id: string; name: string }) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
        </div>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(summary).map(([key, value]) => (
            <Card key={key}>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {typeof value === 'number' && key.toLowerCase().includes('total') && key.toLowerCase().includes('paid')
                  ? formatCurrency(value as number)
                  : typeof value === 'number' && key.toLowerCase().includes('hours')
                  ? `${(value as number).toFixed(1)}h`
                  : String(value)}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Charts */}
      {isLoading ? (
        <Card><Skeleton className="h-64" /></Card>
      ) : (
        <>
          {reportType === 'attendance' && reportData?.attendances && (
            <Card>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Attendance Status Distribution</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Present', value: summary?.present || 0 },
                      { name: 'Absent', value: summary?.absent || 0 },
                      { name: 'Late', value: summary?.late || 0 },
                    ]}
                    dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {['#10b981', '#ef4444', '#f59e0b'].map((color, i) => <Cell key={i} fill={color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}

          {reportType === 'payroll' && reportData?.payrolls && (
            <Card>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Salary Distribution</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={reportData.payrolls.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="employee.lastName" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="netSalary" name="Net Salary" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Data Table */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  {reportType === 'employees' && (
                    <><th>Name</th><th>Employee ID</th><th>Department</th><th>Designation</th><th>Join Date</th><th>Status</th></>
                  )}
                  {reportType === 'attendance' && (
                    <><th>Employee</th><th>Date</th><th>Status</th><th>Clock In</th><th>Clock Out</th><th>Hours</th></>
                  )}
                  {reportType === 'payroll' && (
                    <><th>Employee</th><th>Month</th><th>Basic</th><th>Deductions</th><th>Net</th><th>Status</th></>
                  )}
                  {reportType === 'leaves' && (
                    <><th>Employee</th><th>Type</th><th>Start</th><th>End</th><th>Days</th><th>Status</th></>
                  )}
                </tr>
              </thead>
              <tbody>
                {(reportType === 'employees' ? (reportData || []) :
                  reportType === 'attendance' ? (reportData?.attendances || []) :
                  reportType === 'payroll' ? (reportData?.payrolls || []) :
                  (reportData?.leaves || [])).slice(0, 50).map((row: Record<string, unknown>, i: number) => (
                  <tr key={i}>
                    {reportType === 'employees' && (
                      <>
                        <td className="font-medium">{row.firstName as string} {row.lastName as string}</td>
                        <td className="font-mono text-xs">{row.employeeId as string}</td>
                        <td>{(row.department as { name?: string })?.name || '—'}</td>
                        <td>{row.designation as string || '—'}</td>
                        <td>{formatDate(row.joiningDate as string)}</td>
                        <td><span className={`badge ${row.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>{row.status as string}</span></td>
                      </>
                    )}
                    {reportType === 'attendance' && (
                      <>
                        <td>{(row.employee as { firstName?: string; lastName?: string })?.firstName} {(row.employee as { firstName?: string; lastName?: string })?.lastName}</td>
                        <td>{formatDate(row.date as string)}</td>
                        <td>{row.status as string}</td>
                        <td className="font-mono text-xs">{row.clockIn ? new Date(row.clockIn as string).toLocaleTimeString() : '—'}</td>
                        <td className="font-mono text-xs">{row.clockOut ? new Date(row.clockOut as string).toLocaleTimeString() : '—'}</td>
                        <td>{row.workingHours ? `${Number(row.workingHours).toFixed(2)}h` : '—'}</td>
                      </>
                    )}
                    {reportType === 'payroll' && (
                      <>
                        <td>{(row.employee as { firstName?: string; lastName?: string })?.firstName} {(row.employee as { firstName?: string; lastName?: string })?.lastName}</td>
                        <td>{row.month as number}/{row.year as number}</td>
                        <td>{formatCurrency(Number(row.basicSalary))}</td>
                        <td>{formatCurrency(Number(row.deductions))}</td>
                        <td className="font-bold">{formatCurrency(Number(row.netSalary))}</td>
                        <td><span className={`badge ${row.status === 'PAID' ? 'badge-green' : 'badge-gray'}`}>{row.status as string}</span></td>
                      </>
                    )}
                    {reportType === 'leaves' && (
                      <>
                        <td>{(row.employee as { firstName?: string; lastName?: string })?.firstName} {(row.employee as { firstName?: string; lastName?: string })?.lastName}</td>
                        <td>{(row.leaveType as string)?.replace('_', ' ')}</td>
                        <td>{formatDate(row.startDate as string)}</td>
                        <td>{formatDate(row.endDate as string)}</td>
                        <td>{row.days as number}</td>
                        <td><span className={`badge ${row.status === 'APPROVED' ? 'badge-green' : row.status === 'REJECTED' ? 'badge-red' : 'badge-yellow'}`}>{row.status as string}</span></td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
