import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DollarSign, Download, Zap } from 'lucide-react';
import { payrollApi } from '../../api';
import { Button, Card, Badge, Modal, Pagination, Skeleton, EmptyState } from '../../components/ui';
import { formatCurrency, getStatusColor, getMonthName, MONTHS, CURRENT_YEAR, YEARS } from '../../utils';
import { Payroll } from '../../types';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const PayrollPage: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdminOrHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR';
  const [page, setPage] = useState(1);
  const [genModal, setGenModal] = useState(false);
  const [bulkMonth, setBulkMonth] = useState(new Date().getMonth() + 1);
  const [bulkYear, setBulkYear] = useState(CURRENT_YEAR);
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter] = useState(CURRENT_YEAR);

  const { data, isLoading } = useQuery({
    queryKey: isAdminOrHR ? ['payroll', 'all', { page, month: monthFilter }] : ['payroll', 'my', { page }],
    queryFn: () => isAdminOrHR
      ? payrollApi.getAll({ page, limit: 10, month: monthFilter, year: yearFilter })
      : payrollApi.getMy({ page, limit: 10 }),
  });

  const bulkMutation = useMutation({
    mutationFn: () => payrollApi.generateBulk({ month: bulkMonth, year: bulkYear }),
    onSuccess: (res) => {
      toast.success(`Payroll generated for ${(res.data.data as Payroll[]).length} employees`);
      qc.invalidateQueries({ queryKey: ['payroll'] });
      setGenModal(false);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => payrollApi.markPaid(id),
    onSuccess: () => { toast.success('Marked as paid'); qc.invalidateQueries({ queryKey: ['payroll'] }); },
  });

  const payrolls: Payroll[] = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="page-subtitle">{isAdminOrHR ? 'Manage payroll & salary' : 'Your payslips and salary details'}</p>
        </div>
        {isAdminOrHR && (
          <Button leftIcon={<Zap size={16} />} onClick={() => setGenModal(true)}>Generate Payroll</Button>
        )}
      </div>

      {/* Filters */}
      {isAdminOrHR && (
        <Card>
          <div className="flex gap-3">
            <select value={monthFilter} onChange={e => setMonthFilter(Number(e.target.value))} className="input w-40">
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </Card>
      )}

      {/* Payroll Summary (admin) */}
      {isAdminOrHR && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Total Payroll',
              value: formatCurrency(payrolls.reduce((s, p) => s + Number(p.netSalary), 0)),
              icon: <DollarSign size={20} className="text-primary-600" />,
              color: 'bg-primary-50 dark:bg-primary-900/20'
            },
            {
              label: 'Paid',
              value: payrolls.filter(p => p.status === 'PAID').length,
              icon: <Badge variant="badge-green">PAID</Badge>,
              color: 'bg-green-50 dark:bg-green-900/20'
            },
            {
              label: 'Pending',
              value: payrolls.filter(p => p.status !== 'PAID').length,
              icon: <Badge variant="badge-yellow">DRAFT</Badge>,
              color: 'bg-yellow-50 dark:bg-yellow-900/20'
            },
          ].map(s => (
            <Card key={s.label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{s.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${s.color}`}>{s.icon}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Payroll Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {isAdminOrHR && <th>Employee</th>}
              <th>Period</th>
              <th>Basic</th>
              <th>Bonus</th>
              <th>Deductions</th>
              <th>Tax</th>
              <th>Net Salary</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(6).fill(0).map((_, i) => <tr key={i}>{Array(9).fill(0).map((_, j) => <td key={j}><Skeleton className="h-4" /></td>)}</tr>)
            ) : payrolls.length === 0 ? (
              <tr><td colSpan={9}><EmptyState title="No payroll records" description="No payroll data for this period." /></td></tr>
            ) : payrolls.map((p, i) => (
              <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                {isAdminOrHR && p.employee && (
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-semibold text-primary-600">
                        {p.employee.firstName?.[0]}{p.employee.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{p.employee.firstName} {p.employee.lastName}</p>
                        <p className="text-xs text-gray-500">{(p.employee as { designation?: string }).designation}</p>
                      </div>
                    </div>
                  </td>
                )}
                <td className="font-medium">{getMonthName(p.month)} {p.year}</td>
                <td>{formatCurrency(Number(p.basicSalary))}</td>
                <td className="text-green-500">+{formatCurrency(Number(p.bonus))}</td>
                <td className="text-red-500">-{formatCurrency(Number(p.deductions))}</td>
                <td className="text-orange-500">-{formatCurrency(Number(p.tax))}</td>
                <td className="font-bold text-gray-900 dark:text-white">{formatCurrency(Number(p.netSalary))}</td>
                <td><Badge variant={getStatusColor(p.status)}>{p.status}</Badge></td>
                <td>
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors" title="Download">
                      <Download size={15} />
                    </button>
                    {isAdminOrHR && p.status !== 'PAID' && (
                      <button onClick={() => markPaidMutation.mutate(p.id)}
                        className="text-xs px-2 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                        Mark Paid
                      </button>
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

      {/* Bulk Generate Modal */}
      <Modal isOpen={genModal} onClose={() => setGenModal(false)} title="Generate Bulk Payroll" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Generate payroll for all active employees for the selected period.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Month</label>
              <select value={bulkMonth} onChange={e => setBulkMonth(Number(e.target.value))} className="input">
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <select value={bulkYear} onChange={e => setBulkYear(Number(e.target.value))} className="input">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setGenModal(false)}>Cancel</Button>
            <Button onClick={() => bulkMutation.mutate()} isLoading={bulkMutation.isPending}>Generate Payroll</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PayrollPage;
