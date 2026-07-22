import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { Button } from '../../components/ui';

const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center">
      <div className="text-9xl font-black text-gray-200 dark:text-gray-800 select-none">404</div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Page Not Found</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/dashboard" className="mt-6 inline-block">
        <Button leftIcon={<Home size={16} />}>Go to Dashboard</Button>
      </Link>
    </motion.div>
  </div>
);

export default NotFoundPage;
