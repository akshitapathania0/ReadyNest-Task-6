import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { Skeleton } from './components/ui';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const EmployeesPage = lazy(() => import('./pages/employees/EmployeesPage'));
const EmployeeDetailPage = lazy(() => import('./pages/employees/EmployeeDetailPage'));
const NewEmployeePage = lazy(() => import('./pages/employees/NewEmployeePage'));
const ProfilePage = lazy(() => import('./pages/employees/ProfilePage'));
const DepartmentsPage = lazy(() => import('./pages/departments/DepartmentsPage'));
const AttendancePage = lazy(() => import('./pages/attendance/AttendancePage'));
const LeavePage = lazy(() => import('./pages/leave/LeavePage'));
const PayrollPage = lazy(() => import('./pages/payroll/PayrollPage'));
const PerformancePage = lazy(() => import('./pages/performance/PerformancePage'));
const AnnouncementsPage = lazy(() => import('./pages/announcements/AnnouncementsPage'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const LoadingFallback = () => (
  <div className="p-6 space-y-4">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-4 gap-4">
      {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)}
    </div>
    <Skeleton className="h-64" />
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingFallback />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => (
  <Suspense fallback={<LoadingFallback />}>
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/employees" element={
          <ProtectedRoute roles={['SUPER_ADMIN', 'HR']}><EmployeesPage /></ProtectedRoute>
        } />
        <Route path="/employees/new" element={
          <ProtectedRoute roles={['SUPER_ADMIN', 'HR']}><NewEmployeePage /></ProtectedRoute>
        } />
        <Route path="/employees/:id" element={<EmployeeDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/departments" element={
          <ProtectedRoute roles={['SUPER_ADMIN', 'HR']}><DepartmentsPage /></ProtectedRoute>
        } />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/leave" element={<LeavePage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/reports" element={
          <ProtectedRoute roles={['SUPER_ADMIN', 'HR']}><ReportsPage /></ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);

const App: React.FC = () => (
  <ThemeProvider>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </ThemeProvider>
);

export default App;
