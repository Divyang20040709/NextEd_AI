import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRole }) => {
  // Status: 'loading' | 'authorized' | 'redirect_signup' | 'redirect_login'
  const [authStatus, setAuthStatus] = useState('loading');

  useEffect(() => {
    const checkAuth = () => {
      const isAdmin = allowedRole === 'admin';
      const storedData = isAdmin 
        ? localStorage.getItem('admin_data') 
        : localStorage.getItem('user_data');
      
      const token = isAdmin
        ? localStorage.getItem('admin_token')
        : localStorage.getItem(`${allowedRole}_token`);
      
      // 1. If no user data or token exists
      if (!storedData || !token) {
        setAuthStatus('redirect_signup');
        return;
      }

      const userData = JSON.parse(storedData);
      
      // 2. check role if mismatch
      if (allowedRole && (userData.role || (isAdmin ? 'admin' : 'user')) !== allowedRole) {
        setAuthStatus('redirect_login');
      } else {
        // 3. Everything matches
        setAuthStatus('authorized');
      }
    };

    checkAuth();
  }, [allowedRole]);

  if (authStatus === 'loading') return null;

  if (authStatus === 'redirect_signup') {
    return <Navigate to={allowedRole === 'admin' ? "/admin/signup" : "/signup"} replace />;
  }

  if (authStatus === 'redirect_login') {
    return <Navigate to={allowedRole === 'admin' ? "/admin/login" : "/login"} replace />;
  }

  return children;
};

export default ProtectedRoute;
