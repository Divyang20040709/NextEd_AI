import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = () => {
      const adminData = localStorage.getItem('admin_data');
      if (!adminData) {
        // Not logged in / signed up -> Redirect to Admin Signup as requested
        navigate('/adminpage/adminsignup');
      } else {
        try {
          // Optional: Verify token expiry here if using JWT
          const parsed = JSON.parse(adminData);
          if (parsed && parsed.email) {
            setIsAdmin(true);
          } else {
            navigate('/adminpage/adminsignup');
          }
        } catch (e) {
          navigate('/adminpage/adminsignup');
        }
      }
      setLoading(false);
    };

    checkAdmin();
  }, [navigate]);

  if (loading) {
    // Simple loading state
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Loading Admin Panel...</div>;
  }

  return isAdmin ? children : null;
};

export default AdminProtectedRoute;
