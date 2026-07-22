import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Users, Building2, Clock, CalendarOff, DollarSign,
  Star, Megaphone, Bell, BarChart3, ChevronLeft, ChevronRight, LogOut, Settings
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
  { label: 'Employees', icon: <Users size={18} />, path: '/employees', roles: ['SUPER_ADMIN', 'HR'] },
  { label: 'Departments', icon: <Building2 size={18} />, path: '/departments', roles: ['SUPER_ADMIN', 'HR'] },
  { label: 'Attendance', icon: <Clock size={18} />, path: '/attendance' },
  { label: 'Leave', icon: <CalendarOff size={18} />, path: '/leave' },
  { label: 'Payroll', icon: <DollarSign size={18} />, path: '/payroll' },
  { label: 'Performance', icon: <Star size={18} />, path: '/performance' },
  { label: 'Announcements', icon: <Megaphone size={18} />, path: '/announcements' },
  { label: 'Notifications', icon: <Bell size={18} />, path: '/notifications' },
  { label: 'Reports', icon: <BarChart3 size={18} />, path: '/reports', roles: ['SUPER_ADMIN', 'HR'] },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const filteredItems = navItems.filter(item =>
    !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-30 flex flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-lg shrink-0">H</div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="ml-3 font-bold text-gray-900 dark:text-white text-lg whitespace-nowrap"
            >
              HRMS
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={onToggle}
          className={cn('ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors', collapsed && 'mx-auto')}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {filteredItems.map(item => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink key={item.path} to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
              )}>
              <span className={cn('shrink-0', isActive ? 'text-primary-600 dark:text-primary-400' : '')}>
                {item.icon}
              </span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 p-2">
        <NavLink to="/profile" className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group relative', collapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {user?.employee ? `${user.employee.firstName[0]}${user.employee.lastName[0]}` : 'U'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.role?.replace('_', ' ')}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              My Profile
            </div>
          )}
        </NavLink>
        <button
          onClick={logout}
          className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group relative', collapsed && 'justify-center')}
        >
          <LogOut size={18} className="shrink-0" />
          <AnimatePresence>
            {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Logout</motion.span>}
          </AnimatePresence>
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              Logout
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
};
