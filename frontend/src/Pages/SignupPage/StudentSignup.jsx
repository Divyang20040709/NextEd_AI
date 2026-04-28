import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import NotificationModal from '../../components/NotificationModal/NotificationModal';

import { authAPI, notifyAuthChange } from '../../utils/api';
import { socket } from '../../utils/socket';
import './SignupPage.css';
import { showToast } from '../../utils/CustomToast';


const StudentSignup = () => {
  const navigate = useNavigate();

  const [notification, setNotification] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const [studentData, setStudentData] = useState({
    name: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    institutionName: '',
    studentId: '', // Enrollment / Roll Number
    programName: '',
    courseDepartment: '', // Department
    year: '' // Semester
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


  const handleStudentChange = (e) => {
    setStudentData({ ...studentData, [e.target.name]: e.target.value });
  };


  const handleSignup = async () => {
    const { name, mobileNumber, email, password, confirmPassword, institutionName, studentId, programName, courseDepartment, year } = studentData;
    
    // Validation
    if (!name || !mobileNumber || !email || !password || !confirmPassword) {
      showToast('Please fill in all General Information fields.', "error");
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', "error");
      return;
    }
    if (!institutionName || !studentId || !programName || !courseDepartment || !year) {
      showToast('Please fill in all Contact/Academic Details.', "error");
      return;
    }
    if (!noticeAccepted) {
      showToast('You must accept the Terms & Conditions.', "error");
      return;
    }

    setIsLoading(true);
    const payload = { ...studentData };
    delete payload.confirmPassword;
    
    try {
      const result = await authAPI.signupStudent(payload);

      if (result.success) {
        // Emit signup request via socket
        if (socket) {
          socket.emit('student-signup-request', {
            ...payload,
            timestamp: new Date()
          });
        }

        // Store basic info in localStorage for dot notification logic later
        const pendingData = {
          email: payload.email,
          role: 'student',
          status: 'pending'
        };
        localStorage.setItem('pending_signup', JSON.stringify(pendingData));
        
        // Force Navbar update
        notifyAuthChange();


        showToast(`Signup successful!`, "success");
        setNotification({
          isOpen: true,
          title: 'Request Sent!',
          message: 'Your signup request has been sent to the admin for approval. You will be able to login once approved.',
          type: 'success'
        });
        
        setTimeout(() => {
          navigate('/login'); 
        }, 3000);
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
                Student <span className="brand-highlight">Signup</span>
              </h1>
              <button className="back-link" onClick={() => navigate('/signup')}>
                  ← Choose different role
              </button>
            </header>

            <div className="split-signup-container">
              {/* LEFT PANE - General Information */}
              <div className="split-left-pane">
                <h2>General Information</h2>
                
                <div className="form-group">
                  <label className="form-label">Full Name <span style={{color: 'red'}}>*</span></label>
                  <input 
                    type="text" 
                    name="name"
                    className="form-input" 
                    placeholder="Enter your full name" 
                    value={studentData.name} 
                    onChange={handleStudentChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label className="form-label">Mobile Number <span style={{color: 'red'}}>*</span></label>
                    <input 
                      type="text" 
                      name="mobileNumber"
                      className="form-input" 
                      placeholder="Mobile number" 
                      value={studentData.mobileNumber} 
                      onChange={handleStudentChange}
                    />
                  </div>
                  <div className="form-group half">
                    <label className="form-label">Email Address <span style={{color: 'red'}}>*</span></label>
                    <input 
                      type="email" 
                      name="email"
                      className="form-input" 
                      placeholder="Email address" 
                      value={studentData.email} 
                      onChange={handleStudentChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label className="form-label">Password <span style={{color: 'red'}}>*</span></label>
                    <input 
                      type="password" 
                      name="password"
                      className="form-input" 
                      placeholder="Create a password" 
                      value={studentData.password} 
                      onChange={handleStudentChange} 
                    />
                  </div>
                  <div className="form-group half">
                    <label className="form-label">Confirm Password <span style={{color: 'red'}}>*</span></label>
                    <input 
                      type="password" 
                      name="confirmPassword"
                      className="form-input" 
                      placeholder="Confirm password" 
                      value={studentData.confirmPassword} 
                      onChange={handleStudentChange} 
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT PANE - Contact / Academic Details */}
              <div className="split-right-pane">
                <h2>Contact Details</h2>
                
                <div className="form-group">
                  <label className="form-label">University / Institution Name <span style={{color: 'red'}}>*</span></label>
                  <input 
                    type="text" 
                    name="institutionName"
                    className="form-input" 
                    placeholder="e.g. ABC University" 
                    value={studentData.institutionName} 
                    onChange={handleStudentChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label className="form-label">Student ID <span style={{color: 'red'}}>*</span></label>
                    <input 
                      type="text" 
                      name="studentId"
                      className="form-input" 
                      placeholder="e.g. 2023001" 
                      value={studentData.studentId} 
                      onChange={handleStudentChange}
                    />
                  </div>
                  <div className="form-group half">
                    <label className="form-label">Semester of Study <span style={{color: 'red'}}>*</span></label>
                    <input 
                      type="text" 
                      name="year"
                      className="form-input" 
                      placeholder="e.g. 3rd Semester" 
                      value={studentData.year} 
                      onChange={handleStudentChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label className="form-label">Program / Course Name <span style={{color: 'red'}}>*</span></label>
                    <input 
                      type="text" 
                      name="programName"
                      className="form-input" 
                      placeholder="e.g. B.Tech, MBA" 
                      value={studentData.programName} 
                      onChange={handleStudentChange}
                    />
                  </div>
                  <div className="form-group half">
                    <label className="form-label">Department <span style={{color: 'red'}}>*</span></label>
                    <input 
                      type="text" 
                      name="courseDepartment"
                      className="form-input" 
                      placeholder="e.g. CSE, IT, CE" 
                      value={studentData.courseDepartment} 
                      onChange={handleStudentChange}
                    />
                  </div>
                </div>

                <div className="notice-checkbox-group">
                  <input 
                    type="checkbox" 
                    id="usageNotice" 
                    checked={noticeAccepted} 
                    onChange={(e) => setNoticeAccepted(e.target.checked)} 
                    style={{ marginTop: '4px', cursor: 'pointer', transform: 'scale(1.2)' }}
                  />
                  <label htmlFor="usageNotice">
                    <strong>Terms & Conditions:</strong> Your activities are recorded by the admin so make sure you use this platform sincerely otherwise your account will be banned.
                  </label>
                </div>

                <button 
                  className="signup-button"
                  onClick={handleSignup}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Register Student Account'}
                </button>
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

export default StudentSignup;
