import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { authApi, departmentApi } from '../../api';
import { Button, Input, Select, Card } from '../../components/ui';
import toast from 'react-hot-toast';

const NewEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getAll(),
  });

  const departments = (deptsData?.data?.data || []).map((d: { id: string; name: string }) => ({
    value: d.id,
    label: d.name,
  }));

  const { register, handleSubmit, formState: { errors } } = useForm<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    departmentId: string;
    designation: string;
    salary: string;
    joiningDate: string;
  }>({
    defaultValues: { role: 'EMPLOYEE' },
  });

  const onSubmit = async (data: Record<string, string>) => {
    setIsLoading(true);
    try {
      await authApi.register({
        ...data,
        salary: data.salary ? parseFloat(data.salary) : undefined,
      });
      toast.success('Employee registered successfully');
      navigate('/employees');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to register employee');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/employees" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="page-title">Add Employee</h1>
          <p className="page-subtitle">Register a new employee account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" placeholder="John"
              error={errors.firstName?.message} {...register('firstName', { required: 'Required' })} />
            <Input label="Last Name" placeholder="Doe"
              error={errors.lastName?.message} {...register('lastName', { required: 'Required' })} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Input label="Email Address" type="email" placeholder="john@company.com"
              error={errors.email?.message} {...register('email', { required: 'Required' })} />
            <Input label="Password" type="password" placeholder="Min 8 characters"
              error={errors.password?.message} {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Employment Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Role"
              options={[
                { value: 'EMPLOYEE', label: 'Employee' },
                { value: 'HR', label: 'HR Manager' },
                { value: 'SUPER_ADMIN', label: 'Super Admin' },
              ]}
              {...register('role')} />
            <Select label="Department" options={departments} placeholder="Select department"
              {...register('departmentId')} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Input label="Designation" placeholder="e.g. Software Engineer" {...register('designation')} />
            <Input label="Salary (₹)" type="number" placeholder="e.g. 50000" {...register('salary')} />
          </div>
          <div className="mt-4">
            <Input label="Joining Date" type="date" {...register('joiningDate')} />
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" isLoading={isLoading}>Register Employee</Button>
          <Link to="/employees">
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
};

export default NewEmployeePage;