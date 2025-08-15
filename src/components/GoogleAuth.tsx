import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { motion } from 'framer-motion';

// Google Client ID (в продакшене должен быть в .env)
const GOOGLE_CLIENT_ID = "your-google-client-id.apps.googleusercontent.com";

interface GoogleAuthProps {
  onSuccess?: (credentialResponse: any) => void;
  onError?: () => void;
}

const GoogleAuth: React.FC<GoogleAuthProps> = ({ onSuccess, onError }) => {
  const handleSuccess = (credentialResponse: any) => {
    console.log('🎉 Google Login Success:', credentialResponse);
    
    // Декодируем JWT токен
    if (credentialResponse.credential) {
      const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      console.log('👤 User Info:', payload);
      
      // Сохраняем данные пользователя
      localStorage.setItem('user', JSON.stringify({
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        sub: payload.sub
      }));
      
      if (onSuccess) {
        onSuccess(credentialResponse);
      }
    }
  };

  const handleError = () => {
    console.error('❌ Google Login Failed');
    if (onError) {
      onError();
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="revenue-card max-w-md mx-auto">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
            >
              <span className="text-2xl text-white font-bold">M</span>
            </motion.div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome to Moloco CRM
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Sign in with your Google account to continue
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              logo_alignment="left"
            />
            
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </GoogleOAuthProvider>
  );
};

export default GoogleAuth;
