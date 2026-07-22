import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { notificationApi } from '../../api';
import { Button, Card, Skeleton, EmptyState, Pagination } from '../../components/ui';
import { formatDateTime } from '../../utils';
import { Notification } from '../../types';
import toast from 'react-hot-toast';
import { cn } from '../../utils';

const NOTIFICATION_ICONS: Record<string, string> = {
  LEAVE_APPROVED: '✅',
  LEAVE_REJECTED: '❌',
  LEAVE_APPLIED: '📋',
  PAYROLL_GENERATED: '💰',
  ATTENDANCE_REMINDER: '⏰',
  ANNOUNCEMENT: '📢',
  PERFORMANCE_REVIEW: '⭐',
  GENERAL: '🔔',
};

const NotificationsPage: React.FC = () => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', { page }],
    queryFn: () => notificationApi.getAll({ page, limit: 20 }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => { toast.success('All marked as read'); qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications: Notification[] = data?.data?.data?.notifications || [];
  const unreadCount = data?.data?.data?.unreadCount || 0;
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" leftIcon={<CheckCheck size={16} />} onClick={() => markAllReadMutation.mutate()}
            isLoading={markAllReadMutation.isPending}>
            Mark All Read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array(8).fill(0).map((_, i) => <Card key={i}><Skeleton className="h-16" /></Card>)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Bell size={24} className="text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">No notifications</h3>
          <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <div className={cn('flex items-start gap-4 p-4 rounded-xl border transition-colors',
                n.isRead
                  ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  : 'bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800')}>
                <div className="text-2xl shrink-0">{NOTIFICATION_ICONS[n.type] || '🔔'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={cn('text-sm font-medium', !n.isRead && 'text-primary-700 dark:text-primary-300', n.isRead && 'text-gray-900 dark:text-white')}>
                        {n.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!n.isRead && (
                        <button onClick={() => markReadMutation.mutate(n.id)}
                          className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors" title="Mark read">
                          <Check size={14} />
                        </button>
                      )}
                      <button onClick={() => deleteMutation.mutate(n.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-2" />}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />
      )}
    </div>
  );
};

export default NotificationsPage;
