import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Star } from 'lucide-react';
import { performanceApi, employeeApi } from '../../api';
import { Button, Card, Modal, Skeleton, EmptyState, Badge, Select, Textarea, Input } from '../../components/ui';
import { formatDate } from '../../utils';
import { PerformanceReview } from '../../types';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';

const StarRating: React.FC<{ value: number; onChange?: (v: number) => void; readOnly?: boolean }> = ({ value, onChange, readOnly }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(s => (
      <button key={s} type="button" onClick={() => !readOnly && onChange?.(s)}
        className={`transition-colors ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}>
        <Star size={20} className={s <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'} />
      </button>
    ))}
  </div>
);

const PerformancePage: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdminOrHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR';
  const [modal, setModal] = useState(false);
  const [rating, setRating] = useState(3);
  const [viewReview, setViewReview] = useState<PerformanceReview | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: isAdminOrHR ? ['performance', 'all'] : ['performance', 'my'],
    queryFn: () => isAdminOrHR ? performanceApi.getAll() : performanceApi.getMy(),
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'select'],
    queryFn: () => employeeApi.getAll({ limit: 100 }),
    enabled: isAdminOrHR,
  });

  const createMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => performanceApi.create(d),
    onSuccess: () => {
      toast.success('Review submitted');
      qc.invalidateQueries({ queryKey: ['performance'] });
      setModal(false);
      reset();
      setRating(3);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const onSubmit = (d: Record<string, unknown>) => createMutation.mutate({...d,year: parseInt(String(d.year)),rating,});

  const reviews: PerformanceReview[] = data?.data?.data || [];
  const employees = employeesData?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Performance</h1>
          <p className="page-subtitle">{isAdminOrHR ? 'Track and review employee performance' : 'Your performance reviews'}</p>
        </div>
        {isAdminOrHR && (
          <Button leftIcon={<Plus size={16} />} onClick={() => { setModal(true); reset(); setRating(3); }}>
            Add Review
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(6).fill(0).map((_, i) => <Card key={i}><Skeleton className="h-36" /></Card>)}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState icon={<Star size={40} />} title="No reviews yet" description="Performance reviews will appear here." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors" onClick={() => setViewReview(r)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-semibold text-sm">
                      {r.employee?.firstName?.[0]}{r.employee?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {r.employee?.firstName} {r.employee?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{(r.employee as { designation?: string })?.designation}</p>
                    </div>
                  </div>
                  {r.promotionRecommended && (
                    <Badge variant="badge-purple">Promotion 🎉</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <StarRating value={Math.round(Number(r.rating))} readOnly />
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{Number(r.rating).toFixed(1)}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
                  <span>{r.period} {r.year}</span>
                  <span>Reviewed by: {r.reviewer?.firstName} {r.reviewer?.lastName}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Review Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Performance Review" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Employee" options={employees.map((e: { id: string; firstName: string; lastName: string; employeeId: string }) => ({ value: e.id, label: `${e.firstName} ${e.lastName} (${e.employeeId})` }))}
            placeholder="Select employee"
            error={(errors.employeeId as { message?: string })?.message}
            {...register('employeeId', { required: 'Required' })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Period" options={[{ value: 'Q1', label: 'Q1' }, { value: 'Q2', label: 'Q2' }, { value: 'Q3', label: 'Q3' }, { value: 'Q4', label: 'Q4' }, { value: 'H1', label: 'H1' }, { value: 'H2', label: 'H2' }, { value: 'Annual', label: 'Annual' }]}
              placeholder="Select period"
              {...register('period', { required: 'Required' })} />
            <Input type="number" label="Year" defaultValue={new Date().getFullYear()}
              {...register('year', { required: true,valueAsNumber:true, min: 2020, max: 2030 })} />
          </div>
          <div>
            <label className="label">Rating</label>
            <div className="flex items-center gap-3 mt-1">
              <StarRating value={rating} onChange={setRating} />
              <span className="text-lg font-bold text-gray-700 dark:text-gray-300">{rating}/5</span>
            </div>
          </div>
          <Textarea label="Feedback" placeholder="Detailed performance feedback..."
            error={(errors.feedback as { message?: string })?.message}
            {...register('feedback', { required: 'Required', minLength: { value: 10, message: 'Min 10 chars' } })} rows={4} />
          <div className="grid grid-cols-2 gap-3">
            <Textarea label="Strengths" placeholder="Key strengths..." rows={3} {...register('strengths')} />
            <Textarea label="Areas to Improve" placeholder="Improvement areas..." rows={3} {...register('improvements')} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="promotion" {...register('promotionRecommended')} className="rounded border-gray-300 text-primary-600" />
            <label htmlFor="promotion" className="text-sm text-gray-700 dark:text-gray-300">Recommend for promotion</label>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" type="button" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending}>Submit Review</Button>
          </div>
        </form>
      </Modal>

      {/* View Review Modal */}
      <Modal isOpen={!!viewReview} onClose={() => setViewReview(null)} title="Performance Review" size="lg">
        {viewReview && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-lg">
                {viewReview.employee?.firstName?.[0]}{viewReview.employee?.lastName?.[0]}
              </div>
              <div>
                <p className="font-bold text-lg text-gray-900 dark:text-white">{viewReview.employee?.firstName} {viewReview.employee?.lastName}</p>
                <p className="text-sm text-gray-500">{viewReview.period} {viewReview.year} · Reviewed {formatDate(viewReview.createdAt)}</p>
              </div>
              {viewReview.promotionRecommended && <Badge variant="badge-purple" className="ml-auto">Promotion Recommended 🎉</Badge>}
            </div>
            <div className="flex items-center gap-3">
              <StarRating value={Math.round(Number(viewReview.rating))} readOnly />
              <span className="text-2xl font-bold">{Number(viewReview.rating).toFixed(1)}/5</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Feedback</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{viewReview.feedback}</p>
            </div>
            {viewReview.strengths && (
              <div>
                <h4 className="text-sm font-semibold text-green-600 mb-1">✅ Strengths</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{viewReview.strengths}</p>
              </div>
            )}
            {viewReview.improvements && (
              <div>
                <h4 className="text-sm font-semibold text-orange-600 mb-1">📈 Areas to Improve</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{viewReview.improvements}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PerformancePage;
