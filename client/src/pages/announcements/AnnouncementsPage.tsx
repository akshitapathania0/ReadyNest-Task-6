import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Pin, Edit, Trash2, Eye } from 'lucide-react';
import { announcementApi } from '../../api';
import { Button, Card, Modal, Pagination, Skeleton, EmptyState, Input, Textarea } from '../../components/ui';
import { formatDate } from '../../utils';
import { Announcement } from '../../types';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';

const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdminOrHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR';
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ type: 'create' | 'edit' | 'view'; data?: Announcement } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['announcements', { page }],
    queryFn: () => announcementApi.getAll({ page, limit: 10 }),
  });

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => announcementApi.create(d),
    onSuccess: () => { toast.success('Announcement created'); qc.invalidateQueries({ queryKey: ['announcements'] }); setModal(null); reset(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: { id: string } & Record<string, unknown>) => announcementApi.update(id, d),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['announcements'] }); setModal(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => announcementApi.delete(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['announcements'] }); },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => announcementApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const onSubmit = (d: Record<string, unknown>) => {
    if (modal?.type === 'edit' && modal.data) {
      updateMutation.mutate({ id: modal.data.id, ...d });
    } else {
      createMutation.mutate(d);
    }
  };

  const openEdit = (ann: Announcement) => {
    setModal({ type: 'edit', data: ann });
    setValue('title', ann.title);
    setValue('content', ann.content);
    setValue('isPinned', ann.isPinned);
  };

  const announcements: Announcement[] = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Company-wide communications</p>
        </div>
        {isAdminOrHR && (
          <Button leftIcon={<Plus size={16} />} onClick={() => { setModal({ type: 'create' }); reset(); }}>
            New Announcement
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => <Card key={i}><Skeleton className="h-20" /></Card>)}
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState title="No announcements" description="No announcements have been posted yet." />
      ) : (
        <div className="space-y-3">
          {announcements.map((ann, i) => (
            <motion.div key={ann.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {ann.isPinned && (
                        <span className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                          <Pin size={12} /> Pinned
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(ann.createdAt)}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{ann.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{ann.content}</p>
                  </div>
                  <div className="flex items-start gap-1 shrink-0">
                    <button onClick={() => { setModal({ type: 'view', data: ann }); markReadMutation.mutate(ann.id); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                      <Eye size={15} />
                    </button>
                    {isAdminOrHR && (
                      <>
                        <button onClick={() => openEdit(ann)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <Edit size={15} />
                        </button>
                        <button onClick={() => deleteMutation.mutate(ann.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modal?.type === 'create' || modal?.type === 'edit'} onClose={() => setModal(null)}
        title={modal?.type === 'edit' ? 'Edit Announcement' : 'New Announcement'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" placeholder="Announcement title..." error={(errors.title as { message?: string })?.message}
            {...register('title', { required: 'Title required' })} />
          <Textarea label="Content" placeholder="Write your announcement..." rows={5}
            error={(errors.content as { message?: string })?.message}
            {...register('content', { required: 'Content required' })} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isPinned" {...register('isPinned')} className="rounded border-gray-300 text-primary-600" />
            <label htmlFor="isPinned" className="text-sm text-gray-700 dark:text-gray-300">Pin this announcement</label>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" type="button" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {modal?.type === 'edit' ? 'Update' : 'Publish'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={modal?.type === 'view'} onClose={() => setModal(null)} title={modal?.data?.title} size="lg">
        <div>
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
            {modal?.data?.isPinned && <span className="text-orange-500">📌 Pinned</span>}
            <span>{modal?.data && formatDate(modal.data.createdAt)}</span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{modal?.data?.content}</p>
        </div>
      </Modal>
    </div>
  );
};

export default AnnouncementsPage;
