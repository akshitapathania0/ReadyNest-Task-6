import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, DollarSign, User } from 'lucide-react';
import { employeeApi } from '../../api';
import { Card, Badge, Avatar, Skeleton } from '../../components/ui';
import { formatDate, formatCurrency, getStatusColor } from '../../utils';

const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeApi.getById(id!),
    enabled: !!id,
  });

  const emp = data?.data?.data;

  if (isLoading) return (
    <div className="space-y-4 max-w-4xl">
      <Skeleton className="h-8 w-32" />
      <Card><Skeleton className="h-40" /></Card>
      <div className="grid grid-cols-2 gap-4">
        <Card><Skeleton className="h-32" /></Card>
        <Card><Skeleton className="h-32" /></Card>
      </div>
    </div>
  );

  if (!emp) return <div className="text-center py-20 text-gray-400">Employee not found.</div>;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/employees" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="page-title">Employee Details</h1>
      </div>

      {/* Header Card */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <Avatar src={emp.profilePhoto} firstName={emp.firstName} lastName={emp.lastName} size="xl" />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</h2>
            <p className="text-gray-500 mt-0.5">{emp.designation || 'No designation'}</p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
              <Badge variant={getStatusColor(emp.status)}>{emp.status}</Badge>
              {emp.department && <Badge variant="badge-blue">{emp.department.name}</Badge>}
              <Badge variant="badge-gray">{emp.user?.role?.replace('_', ' ')}</Badge>
            </div>
          </div>
          <div className="text-center sm:text-right space-y-1 text-sm">
            <div className="font-mono font-semibold text-primary-600 text-lg">{emp.employeeId}</div>
            <div className="text-gray-500">Joined {formatDate(emp.joiningDate)}</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Info */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
          <div className="space-y-3">
            {[
              { icon: <Mail size={15} />, label: 'Email', value: emp.user?.email },
              { icon: <Phone size={15} />, label: 'Phone', value: emp.phone },
              { icon: <MapPin size={15} />, label: 'Location', value: [emp.city, emp.state, emp.country].filter(Boolean).join(', ') },
              { icon: <User size={15} />, label: 'Address', value: emp.address },
            ].map(item => item.value ? (
              <div key={item.label} className="flex items-start gap-3">
                <span className="text-gray-400 mt-0.5 shrink-0">{item.icon}</span>
                <div>
                  <div className="text-xs text-gray-400">{item.label}</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">{item.value}</div>
                </div>
              </div>
            ) : null)}
          </div>
        </Card>

        {/* Employment Info */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Employment Details</h3>
          <div className="space-y-3">
            {[
              { icon: <Briefcase size={15} />, label: 'Department', value: emp.department?.name },
              { icon: <Briefcase size={15} />, label: 'Designation', value: emp.designation },
              { icon: <Calendar size={15} />, label: 'Joining Date', value: formatDate(emp.joiningDate) },
              { icon: <DollarSign size={15} />, label: 'Salary', value: formatCurrency(Number(emp.salary)) },
              { icon: <User size={15} />, label: 'Manager', value: emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : undefined },
            ].map(item => item.value ? (
              <div key={item.label} className="flex items-start gap-3">
                <span className="text-gray-400 mt-0.5 shrink-0">{item.icon}</span>
                <div>
                  <div className="text-xs text-gray-400">{item.label}</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">{item.value}</div>
                </div>
              </div>
            ) : null)}
          </div>
        </Card>

        {/* Emergency Contact */}
        {(emp.emergencyName || emp.emergencyPhone) && (
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Emergency Contact</h3>
            <div className="space-y-3">
              {[
                { label: 'Name', value: emp.emergencyName },
                { label: 'Phone', value: emp.emergencyPhone },
                { label: 'Relationship', value: emp.emergencyRelation },
              ].map(item => item.value ? (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{item.value}</span>
                </div>
              ) : null)}
            </div>
          </Card>
        )}

        {/* Leave Balances */}
        {emp.leaveBalances && emp.leaveBalances.length > 0 && (
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Leave Balances ({new Date().getFullYear()})</h3>
            <div className="space-y-2">
              {emp.leaveBalances
                .filter(b => b.year === new Date().getFullYear())
                .map(b => (
                  <div key={b.leaveType} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{b.leaveType.replace('_', ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(100, (b.remaining / b.total) * 100)}%` }} />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-right">{b.remaining}/{b.total}</span>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetailPage;
