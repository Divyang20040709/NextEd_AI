import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import NotificationModal from '../../components/NotificationModal/NotificationModal';

import { authAPI, notifyAuthChange } from '../../utils/api';
import './SignupPage.css';
import { showToast } from '../../utils/CustomToast';


const TeacherSignup = () => {
  const navigate = useNavigate();

  const [notification, setNotification] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const [teacherData, setTeacherData] = useState({
    name: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    institutionName: '',
    designation: '',
    department: '',
    subject: ''
  });

  const [noticeAccepted, setNoticeAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Only clear logged-in session if user navigates to signup while already logged in.
  // Do NOT clear pending_signup or banned user_data.
  React.useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const parsed = JSON.parse(userData);
      // If user is actively logged in, log them out silently before re-registering
      if (parsed.isLoggedIn) {
        localStorage.removeItem('user_data');
        localStorage.removeItem('student_token');
        localStorage.removeItem('teacher_token');
        notifyAuthChange();

      }
      // If user is banned (isLoggedIn: false), keep data intact — they should go to /login
    }
  }, []);


  const handleTeacherChange = (e) => {
    setTeacherData({ ...teacherData, [e.target.name]: e.target.value });
  };


  const handleSignup = async () => {
    const { name, mobileNumber, email, password, confirmPassword, institutionName, designation, department, subject } = teacherData;

    if (!name || !mobileNumber || !email || !password || !confirmPassword || !institutionName || !designation || !department || !subject) {
      showToast('Please fill in all fields.', "error");
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', "error");
      return;
    }
    if (!noticeAccepted) {
      showToast('Please accept the usage policy.', "error");
      return;
    }

    setIsLoading(true);
    const payload = { ...teacherData };
    delete payload.confirmPassword;

    try {
      const result = await authAPI.signupTeacher(payload);
      if (result.success) {
        // Set pending signup state for professional UI filtering
        const pendingData = {
          email: teacherData.email,
          role: 'teacher',
          status: 'pending',
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('pending_signup', JSON.stringify(pendingData));
        
        // Force Navbar update
        notifyAuthChange();


        showToast("Signup successful!", "success");
        setNotification({
          isOpen: true,
          title: 'Request Sent!',
          message: 'Your registration request has been sent to the admin for approval. You will be able to login once approved.',
          type: 'success'
        });
        
        setTimeout(() => navigate('/login'), 3000);
      } else {
        showToast(result.message || "Signup failed.", "error");
      }
    } catch {
      showToast("An error occurred during signup.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <section className="signup-section">
        <div className="signup-floating-wrapper">
          <div className="signup-container">
            <header className="signup-header">
              <h1 className="signup-title">
                Teacher <span className="brand-highlight">Signup</span>
              </h1>
               <button className="back-link" onClick={() => navigate('/signup')}>
                  ← Choose different role
              </button>
            </header>

            <div className="signup-cards-wrapper">
              <div className="split-signup-container" style={{ borderColor: '#38ef7d', boxShadow: '0 0 25px rgba(24, 219, 133, 0.4)' }}>

                {/* LEFT PANE - General Information */}
                <div className="split-left-pane">
                  <h2 style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '15px' }}>General Information</h2>
                  
                  <div className="form-group">
                    <label className="form-label">Full Name <span style={{color: 'red'}}>*</span></label>
                    <input type="text" name="name" className="form-input" placeholder="Enter your full name" value={teacherData.name} onChange={handleTeacherChange} />
                  </div>

                  <div className="form-row">
                    <div className="form-group half">
                      <label className="form-label">Mobile Number <span style={{color: 'red'}}>*</span></label>
                      <input type="text" name="mobileNumber" className="form-input" placeholder="Mobile number" value={teacherData.mobileNumber} onChange={handleTeacherChange} />
                    </div>
                    <div className="form-group half">
                      <label className="form-label">Email Address <span style={{color: 'red'}}>*</span></label>
                      <input type="email" name="email" className="form-input" placeholder="Email address" value={teacherData.email} onChange={handleTeacherChange} />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group half">
                      <label className="form-label">Password <span style={{color: 'red'}}>*</span></label>
                      <input type="password" name="password" className="form-input" placeholder="Create password" value={teacherData.password} onChange={handleTeacherChange} />
                    </div>
                    <div className="form-group half">
                      <label className="form-label">Confirm Password <span style={{color: 'red'}}>*</span></label>
                      <input type="password" name="confirmPassword" className="form-input" placeholder="Confirm" value={teacherData.confirmPassword} onChange={handleTeacherChange} />
                    </div>
                  </div>
                </div>

                {/* RIGHT PANE - Professional Details */}
                <div className="split-right-pane" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                  <h2>Professional Details</h2>

                  <div className="form-group">
                    <label className="form-label">Institution Name <span style={{color: 'red'}}>*</span></label>
                    <input type="text" name="institutionName" className="form-input" placeholder="e.g. ABC University" value={teacherData.institutionName} onChange={handleTeacherChange} />
                  </div>

                  <div className="form-row">
                    <div className="form-group half">
                      <label className="form-label">Designation <span style={{color: 'red'}}>*</span></label>
                      <input type="text" name="designation" className="form-input" placeholder="e.g. HOD" value={teacherData.designation} onChange={handleTeacherChange} />
                    </div>
                    <div className="form-group half">
                      <label className="form-label">Department <span style={{color: 'red'}}>*</span></label>
                      <input type="text" name="department" className="form-input" placeholder="e.g. IT" value={teacherData.department} onChange={handleTeacherChange} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Subjects <span style={{color: 'red'}}>*</span></label>
                    <input type="text" name="subject" className="form-input" placeholder="e.g. Mathematics" value={teacherData.subject} onChange={handleTeacherChange} />
                  </div>

                  <div className="notice-checkbox-group">
                    <input 
                      type="checkbox" 
                      id="usageNotice" 
                      checked={noticeAccepted} 
                      onChange={(e) => setNoticeAccepted(e.target.checked)} 
                      style={{ marginTop: '4px', cursor: 'pointer', transform: 'scale(1.2)' }}
                    />
                    <label htmlFor="usageNotice" style={{ fontSize: '11px', lineHeight: '1.4', cursor: 'pointer' }}>
                      <strong>Agreement:</strong> Your activities are monitored. Misuse leads to banning.
                    </label>
                  </div>

                  <button 
                    className="signup-button"
                    style={{ color: '#11998e', background: 'white', fontWeight: 'bold' }}
                    onClick={handleSignup}
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating..." : "Register Teacher Account"}
                  </button>
                </div>
              </div>
            </div>
          </div>
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

export default TeacherSignup;
