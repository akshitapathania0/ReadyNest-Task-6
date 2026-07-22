import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { employeeApi } from '../../api';
import { Button, Badge, Avatar, Pagination, Skeleton, ConfirmDialog, Card, EmptyState } from '../../components/ui';
import { formatDate, getStatusColor } from '../../utils';
import { Employee } from '../../types';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const EmployeesPage: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['employees', { page, search, status: statusFilter }],
    queryFn: () => employeeApi.getAll({ page, limit: 10, search: search || undefined, status: statusFilter || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeeApi.delete(id),
    onSuccess: () => {
      toast.success('Employee deleted');
      qc.invalidateQueries({ queryKey: ['employees'] });
      setDeleteId(null);
    },
  });

  const employees: Employee[] = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage your workforce</p>
        </div>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'HR') && (
          <Link to="/employees/new">
            <Button leftIcon={<Plus size={16} />}>Add Employee</Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, ID, designation..."
              className="input pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="input w-full sm:w-48"
          >
            <option value="">All Status</option>
            {['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'PROBATION', 'TERMINATED'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Button variant="secondary" leftIcon={<Download size={16} />}>Export</Button>
        </div>
      </Card>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>ID</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Joining Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(8).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(7).fill(0).map((_, j) => (
                    <td key={j}><Skeleton className="h-4" /></td>
                  ))}
                </tr>
              ))
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState title="No employees found" description="Try adjusting your search or filters" />
                </td>
              </tr>
            ) : (
              employees.map((emp, i) => (
                <motion.tr key={emp.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar src={emp.profilePhoto} firstName={emp.firstName} lastName={emp.lastName} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-gray-500">{emp.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{emp.employeeId}</td>
                  <td>{emp.department?.name || '—'}</td>
                  <td>{emp.designation || '—'}</td>
                  <td>{formatDate(emp.joiningDate)}</td>
                  <td><Badge variant={getStatusColor(emp.status)}>{emp.status}</Badge></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link to={`/employees/${emp.id}`}>
                        <button className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                          <Eye size={15} />
                        </button>
                      </Link>
                      <Link to={`/employees/${emp.id}/edit`}>
                        <button className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <Edit size={15} />
                        </button>
                      </Link>
                      {user?.role === 'SUPER_ADMIN' && (
                        <button onClick={() => setDeleteId(emp.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
        {pagination && pagination.totalPages > 1 && (
          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Employee"
        message="This will permanently deactivate the employee account. This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default EmployeesPage;
