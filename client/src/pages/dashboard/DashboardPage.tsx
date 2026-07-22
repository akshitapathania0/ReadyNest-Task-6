import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, Building2, Clock, CalendarOff, DollarSign, TrendingUp, UserPlus, CheckCircle } from 'lucide-react';
import { dashboardApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { StatsCard, Card, Skeleton, Badge } from '../../components/ui';
import { formatCurrency, formatDate, getStatusColor, getMonthName } from '../../utils';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

const AdminDashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => dashboardApi.getAdminStats(),
  });

  const d = data?.data?.data;

  if (isLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array(6).fill(0).map((_, i) => <Card key={i}><Skeleton className="h-20" /></Card>)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[
          { title: 'Total Employees', value: d?.stats?.totalEmployees || 0, icon: <Users size={20} className="text-primary-600" />, color: 'bg-primary-50 dark:bg-primary-900/20' },
          { title: 'Departments', value: d?.stats?.totalDepartments || 0, icon: <Building2 size={20} className="text-emerald-600" />, color: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { title: "Today's Attendance", value: d?.stats?.todayAttendance || 0, icon: <Clock size={20} className="text-blue-600" />, color: 'bg-blue-50 dark:bg-blue-900/20', change: `${d?.stats?.attendanceRate || 0}% rate`, changeType: (d?.stats?.attendanceRate || 0) >= 80 ? 'up' : 'down' as 'up' | 'down' },
          { title: 'Pending Leaves', value: d?.stats?.pendingLeaves || 0, icon: <CalendarOff size={20} className="text-orange-600" />, color: 'bg-orange-50 dark:bg-orange-900/20' },
          { title: 'Active Employees', value: d?.stats?.activeEmployees || 0, icon: <CheckCircle size={20} className="text-green-600" />, color: 'bg-green-50 dark:bg-green-900/20' },
          { title: 'New This Month', value: d?.stats?.newThisMonth || 0, icon: <UserPlus size={20} className="text-purple-600" />, color: 'bg-purple-50 dark:bg-purple-900/20' },
        ].map((s, i) => (
          <motion.div key={s.title} {...fadeIn} transition={{ delay: i * 0.08 }}>
            <StatsCard {...s} />
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
          <Card>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Attendance Trend (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d?.charts?.attendanceTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend />
                <Bar dataKey="present" name="Present" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.35 }}>
          <Card>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Department Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={d?.charts?.departmentDistribution || []} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {(d?.charts?.departmentDistribution || []).map((_: unknown, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="lg:col-span-2">
          <Card>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Monthly Payroll Disbursement</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={d?.charts?.monthlyPayroll || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={v => getMonthName(v).slice(0, 3)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.45 }}>
          <Card className="h-full">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Pending Leave Requests</h3>
            <div className="space-y-3">
              {(d?.recentLeaves || []).slice(0, 4).map((l: { id: string; employee: { firstName: string; lastName: string; designation?: string }; leaveType: string; days: number; status: string }) => (
                <div key={l.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-xs font-semibold shrink-0">
                    {l.employee.firstName[0]}{l.employee.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{l.employee.firstName} {l.employee.lastName}</p>
                    <p className="text-xs text-gray-500">{l.leaveType.replace('_', ' ')} · {l.days}d</p>
                  </div>
                  <Badge variant={getStatusColor(l.status)}>{l.status}</Badge>
                </div>
              ))}
              {(d?.recentLeaves || []).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No pending requests</p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

const EmployeeDashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'employee'],
    queryFn: () => dashboardApi.getEmployeeStats(),
  });

  const d = data?.data?.data;

  if (isLoading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array(6).fill(0).map((_, i) => <Card key={i}><Skeleton className="h-24" /></Card>)}
    </div>
  );

  const today = d?.todayAttendance;

  return (
    <div className="space-y-6">
      {/* Attendance Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Today's Attendance</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-500">Status</span>
              <Badge variant={today ? 'badge-green' : 'badge-gray'}>{today ? today.status : 'NOT CLOCKED IN'}</Badge>
            </div>
            {today?.clockIn && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-500">Clock In</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(today.clockIn).toLocaleTimeString()}</span>
              </div>
            )}
            {today?.clockOut && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-500">Clock Out</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(today.clockOut).toLocaleTimeString()}</span>
              </div>
            )}
            {today?.workingHours && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">Working Hours</span>
                <span className="text-sm font-semibold text-primary-600">{Number(today.workingHours).toFixed(2)}h</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Monthly Attendance Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Present', value: d?.attendanceSummary?.present || 0, color: 'text-green-600' },
              { label: 'Absent', value: d?.attendanceSummary?.absent || 0, color: 'text-red-500' },
              { label: 'Late', value: d?.attendanceSummary?.late || 0, color: 'text-yellow-500' },
              { label: 'Total Hours', value: `${(d?.attendanceSummary?.totalHours || 0).toFixed(1)}h`, color: 'text-primary-600' },
            ].map(s => (
              <div key={s.label} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Leave Balances */}
      <Card>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Leave Balances</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(d?.leaveBalances || []).map((b: { leaveType: string; remaining: number; total: number; used: number }) => (
            <div key={b.leaveType} className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{b.leaveType.replace('_', ' ')}</div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{b.remaining}</span>
                <span className="text-xs text-gray-400">of {b.total}</span>
              </div>
              <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(b.remaining / b.total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Announcements + Payrolls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Announcements</h3>
          <div className="space-y-3">
            {(d?.announcements || []).map((a: { id: string; isPinned: boolean; title: string; content: string; createdAt: string }) => (
              <div key={a.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  {a.isPinned && <span className="text-xs text-orange-500 font-medium">📌 Pinned</span>}
                  <span className="text-xs text-gray-400">{formatDate(a.createdAt)}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{a.title}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.content}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Recent Payslips</h3>
          <div className="space-y-3">
            {(d?.recentPayrolls || []).map((p: { id: string; month: number; year: number; netSalary: number; status: string }) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{getMonthName(p.month)} {p.year}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Net: {formatCurrency(p.netSalary)}</p>
                </div>
                <Badge variant={getStatusColor(p.status)}>{p.status}</Badge>
              </div>
            ))}
            {(d?.recentPayrolls || []).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No payslips yet</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
      {isAdminOrHR ? <AdminDashboard /> : <EmployeeDashboard />}
    </div>
  );
};

export default DashboardPage;
