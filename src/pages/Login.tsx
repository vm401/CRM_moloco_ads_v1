import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import GoogleAuth from '@/components/GoogleAuth';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLoginSuccess = (credentialResponse: any) => {
    if (credentialResponse.credential) {
      const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      
      const userData = {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        sub: payload.sub
      };

      login(userData);
      
      // Перенаправляем на главную страницу
      setTimeout(() => {
        navigate('/overview');
      }, 1000);
    }
  };

  const handleLoginError = () => {
    console.error('Login failed');
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--rc-bg-primary)' }}
    >
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <GoogleAuth 
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
          />
        </motion.div>
        
        {/* Дополнительная информация */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Powerful Campaign Analytics
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Real-time data
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Advanced filters
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Creative insights
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              Performance tracking
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
