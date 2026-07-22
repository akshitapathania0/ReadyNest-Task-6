import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Check, X } from 'lucide-react';
import { leaveApi } from '../../api';
import { Button, Card, Badge, Modal, Pagination, Skeleton, EmptyState, Textarea, Select } from '../../components/ui';
import { formatDate, getStatusColor, LEAVE_TYPE_COLORS } from '../../utils';
import { LeaveRequest } from '../../types';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';

const LEAVE_TYPES = [
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'CASUAL', label: 'Casual Leave' },
  { value: 'PAID', label: 'Paid Leave' },
  { value: 'WORK_FROM_HOME', label: 'Work From Home' },
  { value: 'MATERNITY', label: 'Maternity Leave' },
  { value: 'PATERNITY', label: 'Paternity Leave' },
  { value: 'UNPAID', label: 'Unpaid Leave' },
];

const LeavePage: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdminOrHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR';
  const [applyModal, setApplyModal] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: balancesData } = useQuery({
    queryKey: ['leave-balances'],
    queryFn: () => leaveApi.getBalances(),
  });

  const { data: leavesData, isLoading } = useQuery({
    queryKey: isAdminOrHR ? ['leaves', 'all', { page, status: statusFilter }] : ['leaves', 'my', { page }],
    queryFn: () => isAdminOrHR
      ? leaveApi.getAll({ page, limit: 10, status: statusFilter || undefined })
      : leaveApi.getMy({ page, limit: 10 }),
  });

  const applyMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => leaveApi.apply(data),
    onSuccess: () => { toast.success('Leave request submitted'); qc.invalidateQueries({ queryKey: ['leaves'] }); setApplyModal(false); reset(); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      leaveApi.updateStatus(id, { status, rejectedReason: reason }),
    onSuccess: () => { toast.success('Leave updated'); qc.invalidateQueries({ queryKey: ['leaves'] }); setRejectModal(null); },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => leaveApi.cancel(id),
    onSuccess: () => { toast.success('Leave cancelled'); qc.invalidateQueries({ queryKey: ['leaves'] }); },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onApply = (data: Record<string, unknown>) => applyMutation.mutate(data);

  const leaves: LeaveRequest[] = leavesData?.data?.data || [];
  const pagination = leavesData?.data?.pagination;
  const balances = balancesData?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">{isAdminOrHR ? 'Manage all leave requests' : 'Apply and track your leaves'}</p>
        </div>
        {!isAdminOrHR && (
          <Button leftIcon={<Plus size={16} />} onClick={() => setApplyModal(true)}>Apply for Leave</Button>
        )}
      </div>

      {/* Leave Balances */}
      {!isAdminOrHR && balances.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {balances.map((b: { leaveType: string; remaining: number; total: number; used: number }) => (
            <Card key={b.leaveType} className="text-center">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{b.leaveType.replace('_', ' ')}</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{b.remaining}</div>
              <div className="text-xs text-gray-400 mt-1">{b.used} used of {b.total}</div>
              <div className="mt-3 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(100, (b.remaining / b.total) * 100)}%` }} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      {isAdminOrHR && (
        <Card>
          <div className="flex gap-3">
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input w-48">
              <option value="">All Status</option>
              {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </Card>
      )}

      {/* Leave Requests */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {isAdminOrHR && <th>Employee</th>}
              <th>Type</th>
              <th>Start</th>
              <th>End</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(6).fill(0).map((_, i) => <tr key={i}>{Array(8).fill(0).map((_, j) => <td key={j}><Skeleton className="h-4" /></td>)}</tr>)
            ) : leaves.length === 0 ? (
              <tr><td colSpan={8}><EmptyState title="No leave requests" description="No leave requests found." /></td></tr>
            ) : leaves.map((l, i) => (
              <motion.tr key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                {isAdminOrHR && l.employee && (
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-semibold text-primary-600">
                        {l.employee.firstName?.[0]}{l.employee.lastName?.[0]}
                      </div>
                      <span className="font-medium text-sm">{l.employee.firstName} {l.employee.lastName}</span>
                    </div>
                  </td>
                )}
                <td><Badge variant={LEAVE_TYPE_COLORS[l.leaveType] || 'badge-gray'}>{l.leaveType.replace('_', ' ')}</Badge></td>
                <td>{formatDate(l.startDate)}</td>
                <td>{formatDate(l.endDate)}</td>
                <td className="font-semibold">{l.days}</td>
                <td className="max-w-xs"><p className="truncate text-gray-500 text-xs">{l.reason}</p></td>
                <td><Badge variant={getStatusColor(l.status)}>{l.status}</Badge></td>
                <td>
                  <div className="flex items-center gap-1">
                    {isAdminOrHR && l.status === 'PENDING' && (
                      <>
                        <button onClick={() => statusMutation.mutate({ id: l.id, status: 'APPROVED' })}
                          className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Approve">
                          <Check size={15} />
                        </button>
                        <button onClick={() => setRejectModal({ id: l.id })}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Reject">
                          <X size={15} />
                        </button>
                      </>
                    )}
                    {!isAdminOrHR && l.status === 'PENDING' && (
                      <button onClick={() => cancelMutation.mutate(l.id)}
                        className="text-xs text-red-500 hover:underline">Cancel</button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {pagination && pagination.totalPages > 1 && (
          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />
        )}
      </div>

      {/* Apply Modal */}
      <Modal isOpen={applyModal} onClose={() => setApplyModal(false)} title="Apply for Leave" size="md">
        <form onSubmit={handleSubmit(onApply)} className="space-y-4">
          <Select
            label="Leave Type"
            options={LEAVE_TYPES}
            placeholder="Select type"
            error={(errors.leaveType as { message?: string })?.message}
            {...register('leaveType', { required: 'Select leave type' })}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="input" {...register('startDate', { required: true })} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" className="input" {...register('endDate', { required: true })} />
            </div>
          </div>
          <Textarea label="Reason" placeholder="Please provide a reason (min 10 characters)..." rows={3}
            error={(errors.reason as { message?: string })?.message}
            {...register('reason', { required: 'Reason required', minLength: { value: 10, message: 'Minimum 10 characters' } })} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" type="button" onClick={() => setApplyModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={applyMutation.isPending}>Submit Request</Button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Leave" size="sm">
        <div className="space-y-4">
          <Textarea label="Rejection Reason" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Please provide a reason..." rows={3} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => rejectModal && statusMutation.mutate({ id: rejectModal.id, status: 'REJECTED', reason: rejectReason })} isLoading={statusMutation.isPending}>Reject</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LeavePage;
