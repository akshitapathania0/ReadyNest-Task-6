import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '../../api';
import { Button, Input, Card } from '../../components/ui';
import toast from 'react-hot-toast';

const ForgotPasswordPage: React.FC = () => {
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>();

  const onSubmit = async ({ email }: { email: string }) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error('Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">H</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password?</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">No worries, we'll send you reset instructions.</p>
        </div>
        <Card>
          {sent ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Check your email</h3>
              <p className="text-sm text-gray-500 mt-2">We've sent a password reset link if that account exists.</p>
              <Link to="/login" className="mt-4 inline-block text-sm text-primary-600 hover:underline font-medium">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Email address" type="email" placeholder="you@hrms.com"
                leftIcon={<Mail size={16} />}
                error={errors.email?.message}
                {...register('email', { required: 'Email required' })} />
              <Button type="submit" isLoading={isLoading} className="w-full">Send Reset Link</Button>
            </form>
          )}
        </Card>
        <Link to="/login" className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <ArrowLeft size={14} /> Back to login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
