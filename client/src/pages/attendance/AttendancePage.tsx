import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Clock, Play, Square, Coffee, Calendar } from 'lucide-react';
import { attendanceApi } from '../../api';
import { Button, Card, Badge, Pagination, Skeleton } from '../../components/ui';
import { formatDate, formatTime, getStatusColor, MONTHS, CURRENT_YEAR } from '../../utils';
import { Attendance } from '../../types';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const LiveClock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-center">
      <div className="text-5xl font-bold text-gray-900 dark:text-white font-mono tracking-tight">
        {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="text-gray-500 dark:text-gray-400 mt-1">{formatDate(time)}</div>
    </div>
  );
};

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdminOrHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR';
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year] = useState(CURRENT_YEAR);

  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => attendanceApi.getToday(),
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['attendance', 'my', { page, month, year }],
    queryFn: () => attendanceApi.getMy({ page, limit: 15, month, year }),
  });

  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ['attendance', 'all', { page }],
    queryFn: () => attendanceApi.getAll({ page, limit: 15 }),
    enabled: isAdminOrHR,
  });

  const clockInMutation = useMutation({
    mutationFn: () => attendanceApi.clockIn(),
    onSuccess: () => { 
      toast.success('Clocked in successfully!'); 
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.refetchQueries({ queryKey: ['attendance', 'today'] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Clock in failed'),
  });

  const clockOutMutation = useMutation({
    mutationFn: () => attendanceApi.clockOut(),
    onSuccess: () => { toast.success('Clocked out successfully!'); qc.invalidateQueries({ queryKey: ['attendance'] }); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Clock out failed'),
  });

  const breakMutation = useMutation({
    mutationFn: () => attendanceApi.toggleBreak(),
    onSuccess: (res) => { toast.success(res.data.message); qc.invalidateQueries({ queryKey: ['attendance'] }); },
  });

  const today = todayData?.data?.data;
  const isClockedIn = !!today?.clockIn;
  const isClockedOut = !!today?.clockOut;
  const isOnBreak = !!(today?.breakStart && !today?.breakEnd);

  const history: Attendance[] = historyData?.data?.data || [];
  const pagination = historyData?.data?.pagination;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Track your work hours</p>
        </div>
      </div>

      {/* Clock In/Out Widget */}
      {!isAdminOrHR && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex flex-col items-center py-6 gap-6">
              <LiveClock />
              <div className="flex items-center gap-4">
                {!isClockedIn ? (
                  <Button onClick={() => clockInMutation.mutate()} isLoading={clockInMutation.isPending}
                    leftIcon={<Play size={16} />} size="lg" className="px-8">
                    Clock In
                  </Button>
                ) : !isClockedOut ? (
                  <>
                    <Button onClick={() => breakMutation.mutate()} isLoading={breakMutation.isPending}
                      variant="secondary" leftIcon={<Coffee size={16} />}>
                      {isOnBreak ? 'End Break' : 'Start Break'}
                    </Button>
                    <Button onClick={() => clockOutMutation.mutate()} isLoading={clockOutMutation.isPending}
                      variant="danger" leftIcon={<Square size={16} />} size="lg" className="px-8">
                      Clock Out
                    </Button>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="text-green-500 font-semibold text-lg">✓ Day Complete</div>
                    <div className="text-gray-500 text-sm mt-1">Total: {Number(today?.workingHours || 0).toFixed(2)}h</div>
                  </div>
                )}
              </div>

              {today && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-lg">
                  {[
                    { label: 'Clock In', value: today.clockIn ? formatTime(today.clockIn) : '—' },
                    { label: 'Clock Out', value: today.clockOut ? formatTime(today.clockOut) : '—' },
                    { label: 'Working', value: today.workingHours ? `${Number(today.workingHours).toFixed(2)}h` : '—' },
                    { label: 'Overtime', value: today.overtime ? `${Number(today.overtime).toFixed(2)}h` : '0h' },
                  ].map(s => (
                    <div key={s.label} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{s.value}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* History / All Attendance */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Calendar size={18} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {isAdminOrHR ? 'All Attendance' : 'My Attendance History'}
          </h2>
          {!isAdminOrHR && (
            <div className="flex gap-2 ml-auto">
              <select value={month} onChange={e => setMonth(Number(e.target.value))} className="input w-32 py-1.5 text-sm">
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                {isAdminOrHR && <th>Employee</th>}
                <th>Date</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Working Hrs</th>
                <th>Overtime</th>
                <th>Status</th>
                {isAdminOrHR && <th>Late</th>}
              </tr>
            </thead>
            <tbody>
              {(isAdminOrHR ? allLoading : historyLoading) ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>{Array(isAdminOrHR ? 8 : 7).fill(0).map((_, j) => <td key={j}><Skeleton className="h-4" /></td>)}</tr>
                ))
              ) : (isAdminOrHR ? allData?.data?.data : history)?.map((a: Attendance) => (
                <tr key={a.id}>
                  {isAdminOrHR && a.employee && (
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-xs font-semibold">
                          {a.employee.firstName?.[0]}{a.employee.lastName?.[0]}
                        </div>
                        <span className="text-sm font-medium">{a.employee.firstName} {a.employee.lastName}</span>
                      </div>
                    </td>
                  )}
                  <td>{formatDate(a.date)}</td>
                  <td className="font-mono text-sm">{a.clockIn ? formatTime(a.clockIn) : '—'}</td>
                  <td className="font-mono text-sm">{a.clockOut ? formatTime(a.clockOut) : '—'}</td>
                  <td>{a.workingHours ? `${Number(a.workingHours).toFixed(2)}h` : '—'}</td>
                  <td>{a.overtime ? <span className="text-orange-500">{Number(a.overtime).toFixed(2)}h</span> : '—'}</td>
                  <td><Badge variant={getStatusColor(a.status)}>{a.status}</Badge></td>
                  {isAdminOrHR && <td>{a.isLate ? <Badge variant="badge-yellow">Late</Badge> : <Badge variant="badge-green">On Time</Badge>}</td>}
                </tr>
              ))}
            </tbody>
          </table>
          {pagination && pagination.totalPages > 1 && (
            <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
