import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './AdminAuth.css';
import '../SignupPage/SignupPage.css'; // For common floating layout classes
import { showToast } from '../../utils/CustomToast';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Proactive check: Redirect to signup if no record of admin exists
  React.useEffect(() => {
    const adminData = localStorage.getItem('admin_data');
    if (!adminData) {
      setTimeout(() => {
        showToast('Please register as an admin first.', "error");
        navigate('/admin/signup');
      }, 100);
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Using relative path via proxy
      const response = await axios.post('/api/admin/login', formData);
      
      // Save admin data and token (professional persistence)
      localStorage.setItem('admin_token', response.data.token);
      localStorage.setItem('admin_data', JSON.stringify(response.data.admin));
      
      showToast('Admin Login Successful! Redirecting...', "success");
      
      setTimeout(() => {
        navigate('/admin');
      }, 1500);
    } catch (err) {
      console.error('Admin Login Error:', err);
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
      showToast(msg, "error");
      
      // Professional redirection: if account is not found, take them to signup
      if (err.response?.status === 404 || msg.toLowerCase().includes('not found')) {
        setTimeout(() => {
          showToast('Redirecting to Admin Signup...', "info");
          navigate('/admin/signup');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="signup-section centered">
      <div className="signup-floating-wrapper" style={{ maxWidth: '500px', marginTop: '0' }}>
        <div className="signup-container">
          <header className="signup-header">
            <h1 className="signup-title">
              Admin <span className="brand-highlight">Login</span>
            </h1>
            <p className="signup-subtitle">Access the Super Admin Panel</p>
          </header>

          <div className="signup-cards-wrapper">
            <div className="split-signup-container" style={{ 
              borderColor: '#FF416C', 
              boxShadow: '0 0 25px rgba(255, 65, 108, 0.4)',
              padding: '40px',
              display: 'flex',
              flexDirection: 'column',
              width: '100%'
            }}>
              <form onSubmit={handleSubmit} className="admin-auth-form" style={{ width: '100%' }}>
                <div className="form-group" style={{ marginBottom: '25px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    className="form-input"
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="Enter your admin email"
                    required 
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #eef2f6' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '25px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    className="form-input"
                    value={formData.password} 
                    onChange={handleChange} 
                    placeholder="Enter your password"
                    required 
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #eef2f6' }}
                  />
                </div>

                {error && <div className="error-message" style={{ color: '#FF4D4D', textAlign: 'center', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}

                <button type="submit" className="admin-auth-btn" disabled={loading} style={{ 
                  width: '100%', 
                  padding: '14px',
                  background: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '15px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(255, 65, 108, 0.4)'
                }}>
                  {loading ? 'Authenticating...' : 'Login as Super Admin'}
                </button>

                <div className="admin-auth-footer" style={{ textAlign: 'center', marginTop: '25px' }}>
                  <p style={{ color: '#666', fontSize: '14px' }}>
                    Don't have an account? <Link to="/admin/signup" style={{ color: '#FF416C', fontWeight: '700', textDecoration: 'none' }}>Register as Admin</Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminLogin;
