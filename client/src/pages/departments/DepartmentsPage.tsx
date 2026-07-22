import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Users, Building2 } from 'lucide-react';
import { departmentApi } from '../../api';
import { Button, Card, Modal, Skeleton, EmptyState, Input, ConfirmDialog } from '../../components/ui';
import { Department } from '../../types';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';

const DepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdminOrHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR';
  const [modal, setModal] = useState<{ type: 'create' | 'edit'; data?: Department } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (d: { name: string; description?: string }) => departmentApi.create(d),
    onSuccess: () => { toast.success('Department created'); qc.invalidateQueries({ queryKey: ['departments'] }); setModal(null); reset(); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: { id: string; name: string; description?: string }) => departmentApi.update(id, d),
    onSuccess: () => { toast.success('Department updated'); qc.invalidateQueries({ queryKey: ['departments'] }); setModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentApi.delete(id),
    onSuccess: () => { toast.success('Department deleted'); qc.invalidateQueries({ queryKey: ['departments'] }); setDeleteId(null); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<{ name: string; description: string }>();

  const onSubmit = (d: { name: string; description: string }) => {
    if (modal?.type === 'edit' && modal.data) {
      updateMutation.mutate({ id: modal.data.id, ...d });
    } else {
      createMutation.mutate(d);
    }
  };

  const openEdit = (dept: Department) => {
    setModal({ type: 'edit', data: dept });
    setValue('name', dept.name);
    setValue('description', dept.description || '');
  };

  const departments: Department[] = data?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">Manage organizational structure</p>
        </div>
        {isAdminOrHR && (
          <Button leftIcon={<Plus size={16} />} onClick={() => { setModal({ type: 'create' }); reset(); }}>
            Add Department
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <Card key={i}><Skeleton className="h-32" /></Card>)}
        </div>
      ) : departments.length === 0 ? (
        <EmptyState icon={<Building2 size={40} />} title="No departments yet" description="Create your first department to get started." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept, i) => (
            <motion.div key={dept.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}>
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Building2 size={22} className="text-primary-600" />
                  </div>
                  {isAdminOrHR && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(dept)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <Edit size={15} />
                      </button>
                      <button onClick={() => setDeleteId(dept.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{dept.name}</h3>
                {dept.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{dept.description}</p>
                )}
                <div className="flex items-center gap-1 mt-4 text-sm text-gray-500">
                  <Users size={14} />
                  <span>{dept._count?.employees || 0} employees</span>
                </div>
                {dept.head && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-400 mb-1">Department Head</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {(dept.head as { firstName?: string; lastName?: string }).firstName} {(dept.head as { firstName?: string; lastName?: string }).lastName}
                    </p>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={!!modal} onClose={() => setModal(null)}
        title={modal?.type === 'edit' ? 'Edit Department' : 'Add Department'} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Department Name" placeholder="e.g. Engineering"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })} />
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} placeholder="Brief description of the department..."
              {...register('description')} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" type="button" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {modal?.type === 'edit' ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Department"
        message="Are you sure? This cannot be undone. Departments with employees cannot be deleted."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default DepartmentsPage;
