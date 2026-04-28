import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './AdminAuth.css';
import '../SignupPage/SignupPage.css'; // For split layout classes
import Navbar from '../../components/Navbar/Navbar';
import { showToast } from '../../utils/CustomToast';

const AdminSignup = () => {
  const navigate = useNavigate();
  // Single step sidebar layout
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    institutionName: '',
    designation: '',
    department: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  // Validation merged into submit

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const { name, mobileNumber, email, password, confirmPassword, institutionName, designation, department } = formData;
    
    if (!name || !mobileNumber || !email || !password || !confirmPassword) {
      setError('Please fill in all General Information fields on the left.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!institutionName || !designation || !department) {
      setError('Please fill in all Professional Information fields on the right.');
      return;
    }

    setLoading(true);
    setError('');

    // Remove confirmPassword from payload
    const payload = { ...formData };
    delete payload.confirmPassword;

    try {
      const response = await axios.post('/api/admin/signup', payload);
      
      // Store session data (professional persistence)
      if (response.data.token) {
        localStorage.setItem('admin_token', response.data.token);
        localStorage.setItem('admin_data', JSON.stringify(response.data.admin));
      }

      showToast('Admin Registration Successful! Redirecting to Login...', "success");
      
      setTimeout(() => {
        navigate('/admin/login');
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed. Please try again.';
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="signup-section centered">
        <div className="signup-floating-wrapper" style={{ marginTop: '0' }}>
          <div className="signup-container">
            <header className="signup-header">
              <h1 className="signup-title">
                Admin <span className="brand-highlight">Signup</span>
              </h1>
              <Link className="back-link" to="/admin/login">
                ← Back to Login
              </Link>
            </header>

            <div className="signup-cards-wrapper">
              <div className="split-signup-container" style={{ borderColor: '#FF416C', boxShadow: '0 0 25px rgba(255, 65, 108, 0.4)' }}>

                {/* LEFT PANE - General Information */}
                <div className="split-left-pane">
                  <h2 style={{ background: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '5px' }}>General Information</h2>
                  <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.85rem' }}>Fill all fields to create your admin account</p>

                  <div className="form-group">
                    <label className="form-label">Full Name <span style={{color: 'red'}}>*</span></label>
                    <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} placeholder="Enter your full name" required />
                  </div>

                  <div className="form-row">
                    <div className="form-group half">
                      <label className="form-label">Mobile Number <span style={{color: 'red'}}>*</span></label>
                      <input type="text" name="mobileNumber" className="form-input" value={formData.mobileNumber} onChange={handleChange} placeholder="Mobile number" required />
                    </div>
                    <div className="form-group half">
                      <label className="form-label">Email Address <span style={{color: 'red'}}>*</span></label>
                      <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} placeholder="Email address" required />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group half">
                      <label className="form-label">Password <span style={{color: 'red'}}>*</span></label>
                      <input type="password" name="password" className="form-input" value={formData.password} onChange={handleChange} placeholder="Create password" required />
                    </div>
                    <div className="form-group half">
                      <label className="form-label">Confirm Password <span style={{color: 'red'}}>*</span></label>
                      <input type="password" name="confirmPassword" className="form-input" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm" required />
                    </div>
                  </div>
                </div>

                {/* RIGHT PANE - Professional Details */}
                <div className="split-right-pane" style={{ background: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)' }}>
                  <h2>Professional Details</h2>

                  <div className="form-group">
                    <label className="form-label">University / Institution Name <span style={{color: 'red'}}>*</span></label>
                    <input type="text" name="institutionName" className="form-input" value={formData.institutionName} onChange={handleChange} placeholder="e.g. ABC University" required />
                  </div>

                  <div className="form-row">
                    <div className="form-group half">
                      <label className="form-label">Designation <span style={{color: 'red'}}>*</span></label>
                      <input type="text" name="designation" className="form-input" value={formData.designation} onChange={handleChange} placeholder="e.g. Assistant Professor" required />
                    </div>
                    <div className="form-group half">
                      <label className="form-label">Department <span style={{color: 'red'}}>*</span></label>
                      <input type="text" name="department" className="form-input" value={formData.department} onChange={handleChange} placeholder="e.g. CSE, IT, CE" required />
                    </div>
                  </div>

                  {error && <div className="error-message" style={{ marginTop: '10px', color: '#ff4d4d', fontSize: '13px' }}>{error}</div>}

                  <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                    <button
                      type="button"
                      className="signup-button"
                      style={{ width: '100%', background: 'white', color: '#FF416C', fontWeight: 'bold' }}
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? 'Creating Account...' : 'Sign Up as Super Admin'}
                    </button>
                    <p style={{ marginTop: '10px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
                      Already have an account? <Link to="/admin/login" style={{ color: 'white', textDecoration: 'underline', fontWeight: '600' }}>Login here</Link>
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AdminSignup;
