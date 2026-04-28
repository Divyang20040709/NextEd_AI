import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import NotificationModal from '../../components/NotificationModal/NotificationModal';

import { authAPI, notifyAuthChange } from '../../utils/api';
import './LoginPage.css';
import { showToast } from '../../utils/CustomToast';


const LoginPage = () => {
  const navigate = useNavigate();

  // Modal State
  const [notification, setNotification] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  // State for Student Login
  const [studentData, setStudentData] = useState({
    email: '',
    password: '',
    loading: false
  });

  // State for Teacher Login
  const [teacherData, setTeacherData] = useState({
    email: '',
    password: '',
    loading: false
  });

  const [filteredRole, setFilteredRole] = useState(null);

  // Check for filtered role on mount (Pending Signup OR Banned User)
  useEffect(() => {
    const pendingSignup = localStorage.getItem('pending_signup');
    const userData = localStorage.getItem('user_data');
    
    if (pendingSignup) {
      const { role } = JSON.parse(pendingSignup);
      setFilteredRole(role);
    } else if (userData) {
      const { role } = JSON.parse(userData);
      setFilteredRole(role);
    }
  }, []);

  const handleStudentChange = (e) => {
    setStudentData({ ...studentData, [e.target.name]: e.target.value });
  };

  const handleTeacherChange = (e) => {
    setTeacherData({ ...teacherData, [e.target.name]: e.target.value });
  };


  /* Redirect to Signup if no account exists — allow banned users too */
  useEffect(() => {
    const checkOnMount = () => {
      const savedUser = localStorage.getItem('user_data');
      const pendingSignup = localStorage.getItem('pending_signup');

      // If user is actively logged in, redirect to dashboard
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed.isLoggedIn && parsed.role) {
            navigate(parsed.role === 'student' ? '/student' : '/teacher');
            return;
          }
        } catch { /* ignore */ }
      }

      // No user record at all → redirect to signup
      if (!savedUser && !pendingSignup) {
        showToast('Please signup first to access the login page.', "error");
        navigate('/signup');
      }
      // Banned user (user_data with isLoggedIn:false) → stay, show banned error on submit
      // Pending user (pending_signup) → stay, show pending message
    };

    // Check on mount only — don't listen to authStateChanged here
    // because notifyAuthChange is called after login which would cause
    // immediate redirect conflicting with the post-login modal + setTimeout
    checkOnMount();
  }, [navigate]);


  const handleLogin = async (attemptedRole, data) => {
    if (!data.email || !data.password) {
      showToast("Please fill in all fields.", "error");
      return;
    }

    setStudentData(prev => ({ ...prev, loading: true }));
    setTeacherData(prev => ({ ...prev, loading: true }));

    try {
      let result;
      if (attemptedRole === 'student') {
        result = await authAPI.loginStudent(data);
      } else {
        result = await authAPI.loginTeacher(data);
      }

      if (result.success) {
        const userData = attemptedRole === 'student' ? result.data.student : result.data.teacher;
        const token = result.data.token;

        // Login Success - Store session data (professional persistence)
        localStorage.setItem(`${attemptedRole}_token`, token);
        localStorage.setItem('user_data', JSON.stringify({
          ...userData,
          role: attemptedRole,
          isLoggedIn: true
        }));
        
        // Clear approval/pending status
        localStorage.removeItem('has_approval_update');
        localStorage.removeItem('pending_signup');

        showToast(result.data.message || "Login successful!", "success");
        setNotification({
          isOpen: true,
          title: 'Login Successful',
          message: result.data.message || `Welcome back! Redirecting you to your ${attemptedRole} dashboard.`,
          type: 'success'
        });
        
        // Force Navbar update via custom event (fires in same tab AND cross-tab)
        notifyAuthChange();

        
        setTimeout(() => {
          navigate(attemptedRole === 'student' ? '/student' : '/teacher');
        }, 2000);
      } else {
        showToast(result.message || "Login failed.", "error");
        
        // Smart redirection to signup if account not found
        if (result.status === 'not_found' || result.message.toLowerCase().includes('not found')) {
          setTimeout(() => {
            showToast(`Redirecting to ${attemptedRole} signup...`, "info");
            navigate(`/signup/${attemptedRole}`);
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Login Error:', err);
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setStudentData(prev => ({ ...prev, loading: false }));
      setTeacherData(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <>
      <Navbar />
      <section className="floating-card-section login-section">
        <div className="login-container">
          <header className="login-header">
            <h1 className="login-title">
              Welcome Back to <span className="brand-highlight">NextEd AI</span>
            </h1>
            <p className="login-subtitle">
              Login to access your classroom, assignments, and AI tutor.
            </p>
          </header>

          <div className="login-cards-wrapper">
            {/* Student Login Card */}
            {(!filteredRole || filteredRole === 'student') && (
              <div className="login-card">
                <div className="card-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#1089D3'}}>
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </div>
                <h2 className="card-title">Login as Student</h2>
                
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    className="input-style" 
                    placeholder="name@example.com" 
                    value={studentData.email} 
                    onChange={handleStudentChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input 
                    type="password" 
                    name="password"
                    className="input-style" 
                    placeholder="Enter your password" 
                    value={studentData.password} 
                    onChange={handleStudentChange}
                  />
                </div>

                <button 
                  className="button-primary"
                  onClick={() => handleLogin('student', studentData)}
                  style={{width: '100%', marginTop: '20px'}}
                >
                  Login as Student
                </button>
              </div>
            )}

            {/* Teacher Login Card */}
            {(!filteredRole || filteredRole === 'teacher') && (
              <div className="login-card" style={{ borderColor: filteredRole === 'teacher' ? '#38ef7d' : 'rgba(0,0,0,0.05)', boxShadow: filteredRole === 'teacher' ? '0 10px 30px rgba(24, 219, 133, 0.15)' : '0 10px 30px rgba(0, 0, 0, 0.05)' }}>
                <div className="card-icon" style={{ background: 'rgba(24, 219, 133, 0.1)' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#11998e'}}>
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                </div>
                <h2 className="card-title">Login as Teacher</h2>
                
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    className="input-style" 
                    placeholder="name@school.edu" 
                    value={teacherData.email} 
                    onChange={handleTeacherChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input 
                    type="password" 
                    name="password"
                    className="input-style" 
                    placeholder="Enter your password" 
                    value={teacherData.password} 
                    onChange={handleTeacherChange}
                  />
                </div>

                <button 
                  className="button-primary"
                  onClick={() => handleLogin('teacher', teacherData)}
                  style={{width: '100%', marginTop: '20px', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', boxShadow: '0 8px 20px rgba(24, 219, 133, 0.3)' }}
                >
                  Login as Teacher
                </button>
              </div>
            )}
          </div>

          {filteredRole && (
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <button 
                onClick={() => {
                  setFilteredRole(null);
                  localStorage.removeItem('pending_signup');
                  localStorage.removeItem('has_approval_update');
                  notifyAuthChange();

                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1089D3',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Login with different account
              </button>
            </div>
          )}
        </div>
      </section>

      <NotificationModal 
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </>
  );
};

export default LoginPage;
