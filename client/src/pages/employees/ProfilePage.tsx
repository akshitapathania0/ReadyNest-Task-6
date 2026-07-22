import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Camera, Save, Lock } from 'lucide-react';
import { employeeApi, authApi } from '../../api';
import { Button, Card, Input, Badge } from '../../components/ui';
import { formatDate, getStatusColor } from '../../utils';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const qc = useQueryClient();
  const [photoUploading, setPhotoUploading] = useState(false);
  const [pwModal, setPwModal] = useState(false);

  const { data } = useQuery({
    queryKey: ['employee', 'me'],
    queryFn: () => employeeApi.getMe(),
    enabled: !!user?.employee,
  });

  const employee = data?.data?.data;

  const updateMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => employeeApi.update(employee!.id, d),
    onSuccess: () => { toast.success('Profile updated'); qc.invalidateQueries({ queryKey: ['employee', 'me'] }); refreshUser(); },
  });

  const pwMutation = useMutation({
    mutationFn: (d: { currentPassword: string; newPassword: string }) => authApi.changePassword(d),
    onSuccess: () => { toast.success('Password changed'); setPwModal(false); pwReset(); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const { register, handleSubmit } = useForm({ values: employee ? { phone: employee.phone || '', address: employee.address || '', city: employee.city || '', state: employee.state || '', country: employee.country || '', emergencyName: employee.emergencyName || '', emergencyPhone: employee.emergencyPhone || '', emergencyRelation: employee.emergencyRelation || '' } : {} });

  const { register: pwReg, handleSubmit: pwSubmit, reset: pwReset, formState: { errors: pwErrors } } = useForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employee) return;
    setPhotoUploading(true);
    try {
      await employeeApi.uploadPhoto(employee.id, file);
      toast.success('Photo updated');
      qc.invalidateQueries({ queryKey: ['employee', 'me'] });
      refreshUser();
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  const onPwSubmit = (d: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (d.newPassword !== d.confirmPassword) { toast.error('Passwords do not match'); return; }
    pwMutation.mutate({ currentPassword: d.currentPassword, newPassword: d.newPassword });
  };

  if (!employee) return <div className="text-center py-20 text-gray-400">Loading profile...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">View and update your profile information</p>
        </div>
      </div>

      {/* Profile Header */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            {employee.profilePhoto ? (
              <img src={employee.profilePhoto} alt="Profile" className="w-24 h-24 rounded-2xl object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-3xl font-bold">
                {employee.firstName[0]}{employee.lastName[0]}
              </div>
            )}
            <label className={`absolute -bottom-2 -right-2 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors ${photoUploading ? 'opacity-50' : ''}`}>
              <Camera size={14} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={photoUploading} />
            </label>
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{employee.firstName} {employee.lastName}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">{employee.designation || 'No designation set'}</p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
              <Badge variant={getStatusColor(employee.status)}>{employee.status}</Badge>
              <Badge variant="badge-blue">{user?.role?.replace('_', ' ')}</Badge>
              {employee.department && <Badge variant="badge-purple">{employee.department.name}</Badge>}
            </div>
          </div>
          <div className="text-right text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <div><span className="font-medium">ID:</span> {employee.employeeId}</div>
            <div><span className="font-medium">Joined:</span> {formatDate(employee.joiningDate)}</div>
            <div><span className="font-medium">Email:</span> {user?.email}</div>
          </div>
        </div>
      </Card>

      {/* Edit Form */}
      <form onSubmit={handleSubmit(d => updateMutation.mutate(d))}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
            <div className="space-y-3">
              <Input label="Phone Number" placeholder="+91 XXXXXXXXXX" {...register('phone')} />
              <Input label="Address" placeholder="Street address" {...register('address')} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="City" placeholder="City" {...register('city')} />
                <Input label="State" placeholder="State" {...register('state')} />
              </div>
              <Input label="Country" placeholder="Country" {...register('country')} />
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Emergency Contact</h3>
            <div className="space-y-3">
              <Input label="Contact Name" placeholder="Emergency contact name" {...register('emergencyName')} />
              <Input label="Contact Phone" placeholder="Emergency contact phone" {...register('emergencyPhone')} />
              <Input label="Relationship" placeholder="e.g. Spouse, Parent" {...register('emergencyRelation')} />
            </div>
          </Card>
        </div>

        <div className="flex gap-3 mt-4">
          <Button type="submit" leftIcon={<Save size={16} />} isLoading={updateMutation.isPending}>
            Save Changes
          </Button>
          <Button type="button" variant="secondary" leftIcon={<Lock size={16} />} onClick={() => setPwModal(true)}>
            Change Password
          </Button>
        </div>
      </form>

      {/* Change Password */}
      {pwModal && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Change Password</h3>
            <form onSubmit={pwSubmit(onPwSubmit)} className="space-y-3 max-w-sm">
              <Input label="Current Password" type="password" {...pwReg('currentPassword', { required: true })} />
              <Input label="New Password" type="password" {...pwReg('newPassword', { required: true, minLength: 8 })}
                error={pwErrors.newPassword ? 'Min 8 characters' : undefined} />
              <Input label="Confirm Password" type="password" {...pwReg('confirmPassword', { required: true })} />
              <div className="flex gap-3">
                <Button type="submit" isLoading={pwMutation.isPending}>Update Password</Button>
                <Button type="button" variant="secondary" onClick={() => { setPwModal(false); pwReset(); }}>Cancel</Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default ProfilePage;
