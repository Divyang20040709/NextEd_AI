import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { showToast } from '../../utils/CustomToast';
import NotificationModal from '../../components/NotificationModal/NotificationModal';
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal';

import { authAPI, classroomAPI, postAPI, notifyAuthChange } from '../../utils/api';

import { socket, connectSocket } from '../../utils/socket';
import StudentExams from './StudentExams';
import './StudentClassroom.css';

// Reuse Teacher's Icons or define specific ones
const Icons = {
  Join: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>),
  MyClass: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
  Manage: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>),
  Logout: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>),
  Delete: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>),
  Leave: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>),
  Menu: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>),
  Close: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>)
};

const StudentClassroom = () => {
  const navigate = useNavigate();
  
  // Identifying the student
  const [userData] = useState(() => {
    const saved = localStorage.getItem('user_data');
    return saved ? JSON.parse(saved) : null;
  });

  const userEmail = userData?.email;
  const studentName = userData?.name || 'Student';

  // Helper to clean legacy teacherName values that have 'undefined' appended
  const cleanName = (name) => name ? name.replace(/ undefined$/, '').trim() : name;

  const [activeTab, setActiveTab] = useState('my-classroom'); // Default view
  const [selectedClassroom, setSelectedClassroom] = useState(null); // For inside view
  const selectedClassroomRef = useRef(null);
  useEffect(() => {
    selectedClassroomRef.current = selectedClassroom;
  }, [selectedClassroom]);

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false); // Mobile Nav State
  
  // Identifying the student (in a real app, this comes from Auth)
  // For this mock, we'll assume the student entered their name in Join, 
  // OR we use a session-based name. Let's try to get it from local storage user_data if available.
  // Modal States
  const [notification, setNotification] = useState({ isOpen: false, title: '', message: '', type: 'success' });
  const [confirmation, setConfirmation] = useState({ isOpen: false, type: '', id: null, title: '', message: '' });

  // State Management
  const [myClassrooms, setMyClassrooms] = useState([]);
  const [posts, setPosts] = useState([]);
  const [postSearch, setPostSearch] = useState('');
  const [submissionMessage, setSubmissionMessage] = useState({}); // { postId: message }
  const [submissionFiles, setSubmissionFiles] = useState({}); // { postId: [files] }
  const [hasExistingSubmission, setHasExistingSubmission] = useState({}); // { postId: submissionDate }
  const [isLoading, setIsLoading] = useState(false);
  const [pendingExams, setPendingExams] = useState({}); // Stores which classrooms have new exams { classroomId: true }
  const [classroomView, setClassroomView] = useState("stream"); // "stream" or "exams"

  // Fetch enrolled classrooms
  const fetchMyClassrooms = useCallback(async () => {
    if (!userEmail) return;
    
    setIsLoading(true);
    const result = await classroomAPI.getStudentClassrooms(userEmail);
    
    if (result.success) {
      setMyClassrooms(result.data.classrooms);
    } else {
      setNotification({
        isOpen: true,
        title: 'Error',
        message: result.message,
        type: 'error'
      });
    }
    setIsLoading(false);
  }, [userEmail]);

  useEffect(() => {
    fetchMyClassrooms();
  }, [userData?.email, fetchMyClassrooms]);

  // Handle real-time status updates (ban/delete)
  useEffect(() => {
    if (!userEmail) return;

    connectSocket(userEmail);

    const handleStatusUpdate = (data) => {
      // If student is banned
      if (data.status === 'banned') {
        const storedData = localStorage.getItem('user_data');
        if (storedData) {
          try {
            const upDatedData = JSON.parse(storedData);
            upDatedData.isLoggedIn = false;
            localStorage.setItem('user_data', JSON.stringify(upDatedData));
          } catch (error) {
            console.error("Error updating local storage:", error);
          }
        }

        // Remove auth tokens
        localStorage.removeItem('student_token');
        localStorage.removeItem('has_approval_update');
        
        // Trigger storage event for other tabs/components
        notifyAuthChange();


        // Show ban confirmation popup — student must click to proceed
        setConfirmation({
          isOpen: true,
          type: '_ban_redirect',
          title: '🚫 Account Suspended',
          message: 'Your account has been banned by the admin. Please contact the admin to get your account unbanned.',
          isDanger: true,
          confirmText: 'Yes, I Understand'
        });
      } 
      // If student is deleted or rejected
      else if (data.status === 'deleted' || data.status === 'rejected') {
        localStorage.removeItem('user_data');
        localStorage.removeItem('preferredRole');
        // Trigger storage event
        notifyAuthChange();


        setNotification({
          isOpen: true,
          title: data.status === 'deleted' ? 'Account Deleted' : 'Application Rejected',
          message: data.message || `Your account has been ${data.status} by an admin.`,
          type: 'error',
          buttonText: 'OK'
        });

        setTimeout(() => {
          navigate('/signup');
        }, 3000);
      }
    };

    socket.on('student-status-updated', handleStatusUpdate);

    // New: Stream updates
    socket.on('classroom-deleted', (data) => {
      setNotification({
        isOpen: true,
        title: 'Classroom Removed',
        message: data.message,
        type: 'warning'
      });
      fetchMyClassrooms();
      if (selectedClassroomRef.current?._id === data.classroomId) {
        setSelectedClassroom(null);
        setActiveTab('my-classroom');
      }
    });

    socket.on('post-added', (data) => {
      if (selectedClassroomRef.current?._id === data.classroomId) {
        setPosts(prev => [data.post, ...prev]);
      }
    });

    socket.on('post-updated', (data) => {
      setPosts(prev => prev.map(p => p._id === data.postId ? data.post : p));
    });

    socket.on('post-deleted', (data) => {
      setPosts(prev => prev.map(p => 
        p._id === data.postId ? { ...p, isDeleted: true, deletedBy: data.deletedBy } : p
      ));
    });

    socket.on('new-exam', (data) => {
      // If we are currently inside this classroom, maybe we don't show the dot, or we do.
      // Easiest is to always show dot unless they click the exams tab.
      if (data.classroomId) {
        setPendingExams(prev => ({ ...prev, [data.classroomId]: true }));
      }
    });

    return () => {
      socket.off('student-status-updated', handleStatusUpdate);
      socket.off('classroom-deleted');
      socket.off('post-added');
      socket.off('post-updated');
      socket.off('post-deleted');
      socket.off('new-exam');
      // Do NOT disconnect socket on unmount — if the student was just banned,
      // the socket must stay connected so the login page can receive the unban event.
    };
  }, [userEmail, navigate]);

  const handleSubmissionFileChange = (e, postId) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSubmissionFiles(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), {
            name: file.name,
            type: file.type,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            data: reader.result
          }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeSubmissionFile = (postId, index) => {
    setSubmissionFiles(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).filter((_, i) => i !== index)
    }));
  };


  const fetchPosts = useCallback(async () => {
    if (!selectedClassroom) return;
    
    setIsLoading(true);
    const result = await postAPI.getClassroomPosts(selectedClassroom._id);
    
    if (result.success) {
      const fetchedPosts = result.data.posts;
      setPosts(fetchedPosts);

      // Fetch student's existing submissions for these posts
      fetchedPosts.forEach(async (post) => {
        if (post.allowStudentUpload) {
          const subResult = await postAPI.getStudentSubmission(post._id, userEmail);
          if (subResult.success && subResult.data.submission) {
            const sub = subResult.data.submission;
            setSubmissionMessage(prev => ({ ...prev, [post._id]: sub.message }));
            setSubmissionFiles(prev => ({ ...prev, [post._id]: sub.files }));
            // Store that this post has an existing submission
            setHasExistingSubmission(prev => ({ ...prev, [post._id]: sub.submittedAt }));
          }
        }
      });
    } else {
      setNotification({
        isOpen: true,
        title: 'Error',
        message: result.message,
        type: 'error'
      });
    }
    setIsLoading(false);
  }, [selectedClassroom]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);



  // Join Form State
  const [joinData, setJoinData] = useState({
    name: studentName, // Default to extracted name, but allow editing
    code: ''
  });



  // Handle Join
  const handleJoinClassroom = async (e) => {
    e.preventDefault();
    const { name, code } = joinData;
    
    setIsLoading(true);
    const result = await classroomAPI.joinClassroom(code, userEmail, name, userData?.studentId || 'N/A');

    
    if (result.success) {
      setNotification({
        isOpen: true,
        title: 'Success!',
        message: `You have successfully joined ${result.data.classroom.subject}.`,
        type: 'success',
        buttonText: 'Start Learning'
      });
      setActiveTab('my-classroom');
      setJoinData({ ...joinData, code: '' });
      fetchMyClassrooms(); // Refresh local list
    } else {
      setNotification({
        isOpen: true,
        title: 'Error Joining',
        message: result.message,
        type: 'error'
      });
    }
    
    setIsLoading(false);
    setIsMobileNavOpen(false);
  };

  // Logic to Leave Classroom
  const initiateLeaveClassroom = (id) => {
    setConfirmation({
      isOpen: true,
      type: 'leave-class',
      id: id,
      title: 'Leave Classroom?',
      message: 'Are you sure you want to leave this classroom?',
      isDanger: true,
      confirmText: 'Leave'
    });
  };

  // Logic for Global Actions
  const initiateLogout = () => {
    if (localStorage.getItem('isExamActive') === 'true') {
      showToast("⚠️ You cannot log out during exam!", "error");
      return;
    }
     setConfirmation({
      isOpen: true,
      type: 'logout',
      title: 'Confirm Logout',
      message: 'Are you sure you want to log out?',
      isDanger: false,
      confirmText: 'Logout'
    });
    setIsMobileNavOpen(false);
  };

  const initiateDeleteAccount = () => {
    if (localStorage.getItem('isExamActive') === 'true') {
      showToast("⚠️ You cannot delete account during exam!", "error");
      return;
    }
    setConfirmation({
      isOpen: true,
      type: 'delete-account',
      title: 'Delete My Account',
      message: 'This will delete your account session. (Note: In this demo, it just clears your local session).',
      isDanger: true,
      confirmText: 'Delete'
    });
    setIsMobileNavOpen(false);
  };

  // Confirm Action Handler
  const handleConfirmAction = async () => {
    if (confirmation.type === '_ban_redirect') {
      // Student acknowledged ban — redirect to login.
      // Do NOT disconnect socket here — socket must stay alive so the login
      // page Navbar can receive the unban 'approved' event and show the red dot.
      setConfirmation({ ...confirmation, isOpen: false });
      navigate('/login');
      return;
    }
    
    if (confirmation.type === 'leave-class') {
        setIsLoading(true);
        const result = await classroomAPI.leaveClassroom(confirmation.id, userEmail);
        
        if (result.success) {
          setNotification({ isOpen: true, title: 'Left', message: 'You have left the classroom.' });
          fetchMyClassrooms(); // Refresh list
        } else {
          setNotification({ isOpen: true, title: 'Error', message: result.message, type: 'error' });
        }
        setIsLoading(false);
    }
    else if (confirmation.type === 'logout') {
      // Call backend logout API
      if (userEmail) {
        await authAPI.logout(userEmail, 'student');
        const userDataCopy = { ...userData, isLoggedIn: false };
        localStorage.setItem('user_data', JSON.stringify(userDataCopy));
      }
      navigate('/homepage');
    }
    else if (confirmation.type === 'delete-account') {
      // Call backend delete account API
      if (userEmail) {
        const result = await authAPI.deleteAccount(userEmail, 'student');
        
        if (result.success) {
          // Clear all local data
          localStorage.removeItem('user_data');
          localStorage.removeItem('preferredRole');
          navigate('/homepage');
        } else {
          setNotification({ isOpen: true, title: 'Error', message: result.message, type: 'error' });
        }
      }
    }
    setConfirmation({ ...confirmation, isOpen: false });
  };

  const handlePostSubmission = async (postId) => {
    const message = submissionMessage[postId] || '';
    const files = submissionFiles[postId] || [];

    if (!message.trim() && files.length === 0) {
      showToast("Please add a message or at least one file.", "error");
      return;
    }

    setIsLoading(true);
    const submissionData = {
      postId,
      studentId: userEmail,
      studentName: studentName,
      message: message,
      files: files
    };

    const result = await postAPI.submitToPost(submissionData);
    if (result.success) {
      setNotification({
        isOpen: true,
        title: "Success",
        message: "Your submission has been received successfully!",
        type: "success"
      });
      setSubmissionMessage(prev => ({ ...prev, [postId]: '' }));
      setSubmissionFiles(prev => ({ ...prev, [postId]: [] }));
      // Update existing submission state locally
      setHasExistingSubmission(prev => ({ ...prev, [postId]: new Date().toISOString() }));
    } else {
      setNotification({
        isOpen: true,
        title: "Submission Failed",
        message: result.message,
        type: "error"
      });
    }
    setIsLoading(false);
  };

  const toggleMobileNav = () => setIsMobileNavOpen(!isMobileNavOpen);

  const filteredPosts = posts.filter(post =>
    (post.title || '').toLowerCase().includes(postSearch.toLowerCase()) ||
    (post.description || '').toLowerCase().includes(postSearch.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="flex-dashboard-wrapper">
        
        <button className="mobile-menu-toggle" onClick={toggleMobileNav}>
          {isMobileNavOpen ? <Icons.Close /> : <Icons.Menu />}
        </button>
        <div className={`mobile-nav-overlay ${isMobileNavOpen ? 'active' : ''}`} onClick={() => setIsMobileNavOpen(false)}></div>

        {/* Sidebar */}
        <aside className={`floating-sidebar ${isMobileNavOpen ? 'mobile-open' : ''}`}>
           <div className="sidebar-header">
            <h3>Menu</h3>
            <button className="close-btn-mobile" onClick={() => setIsMobileNavOpen(false)}><Icons.Close /></button>
          </div>

          <nav className="sidebar-menu">
            <button 
              className={`sidebar-btn ${activeTab === 'join' ? 'active' : ''}`}
              onClick={() => { 
                if (localStorage.getItem('isExamActive') === 'true') {
                  showToast("⚠️ You cannot switch tabs during exam!", "error");
                  return;
                }
                setActiveTab('join'); 
                setSelectedClassroom(null); 
                setIsMobileNavOpen(false); 
              }}
            >
              <Icons.Join /> Join Classroom
            </button>
            <button 
              className={`sidebar-btn ${activeTab === 'my-classroom' ? 'active' : ''}`}
              onClick={() => { 
                if (localStorage.getItem('isExamActive') === 'true') {
                  showToast("⚠️ You cannot switch tabs during exam!", "error");
                  return;
                }
                setActiveTab('my-classroom'); 
                setSelectedClassroom(null); 
                setIsMobileNavOpen(false); 
              }}
            >
              <Icons.MyClass /> My Classrooms
            </button>
            <button 
              className={`sidebar-btn ${activeTab === 'manage' ? 'active' : ''}`}
              onClick={() => { 
                if (localStorage.getItem('isExamActive') === 'true') {
                  showToast("⚠️ You cannot switch tabs during exam!", "error");
                  return;
                }
                setActiveTab('manage'); 
                setSelectedClassroom(null); 
                setIsMobileNavOpen(false); 
              }}
            >
              <Icons.Manage /> Manage Classrooms
            </button>
          </nav>

          {/* Student Profile Section */}
          {userData && (
            <div className="sidebar-profile">
              <div className="profile-name">
                {studentName}
              </div>
              <div className="profile-email">
                {userEmail}
              </div>
            </div>
          )}
          
          <div className="sidebar-footer">
            <button className="sidebar-btn logout-btn" onClick={initiateLogout}>
              <Icons.Logout /> Logout
            </button>
            <button className="sidebar-btn delete-account-btn" onClick={initiateDeleteAccount}>
              <Icons.Delete /> Delete My Account
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="floating-content-area">

          {/* 1. Join Classroom View */}
          {activeTab === 'join' && (
            <div className="view-container fade-in">
              <header className="content-header">
                <h2 className="content-title">Join a Classroom</h2>
                <p className="content-subtitle">Enter the code shared by your teacher.</p>
              </header>
              <div className="form-card-dashboard">
                <form onSubmit={handleJoinClassroom}>
                  <div className="form-group">
                    <label>Your Identity (Email)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={userEmail || 'Guest'}
                      disabled
                      style={{ background: '#e2e8f0', color: '#64748b' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Enter Name</label>
                     <input 
                      type="text" 
                      className="form-input" 
                      value={joinData.name}
                      onChange={(e) => setJoinData({...joinData, name: e.target.value})}
                      placeholder="Your Full Name"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Classroom Code (6-digit)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 483921" 
                      value={joinData.code}
                      onChange={(e) => setJoinData({...joinData, code: e.target.value})}
                      required 
                    />
                  </div>
                  <button type="submit" className="submit-btn" disabled={!joinData.code}>
                    Join Classroom
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 2. My Classrooms List */}
          {activeTab === 'my-classroom' && !selectedClassroom && (
            <div className="view-container fade-in">
              <header className="content-header">
                <h2 className="content-title">My Classrooms</h2>
                <p className="content-subtitle">Your active courses and subjects.</p>
              </header>
              {myClassrooms.length > 0 ? (
                <div className="classroom-grid">
                  {myClassrooms.map((room) => (
                    <div key={room._id} className="classroom-card">
                      <div className="card-header-gradient">
                        <h3 className="card-subject">{room.subject}</h3>
                        <div className="card-details">Class {room.classGrade} - {room.division}</div>
                      </div>
                      <div className="card-body">
                        <div className="teacher-name">{room.teacherName}</div>
                         <div className="class-code-badge">
                           Class Code: {room.code}
                         </div>
                        <div className="classroom-card-actions">
                          <button 
                            className="card-action-btn card-action-btn--primary"
                            onClick={() => { 
                              if (localStorage.getItem('isExamActive') === 'true') {
                                showToast("⚠️ You cannot switch views during exam!", "error");
                                return;
                              }
                              setSelectedClassroom(room); 
                              setClassroomView("stream"); 
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                            Enter Classroom
                          </button>
                          <button 
                            className="card-action-btn card-action-btn--secondary"
                            onClick={() => { 
                              if (localStorage.getItem('isExamActive') === 'true') {
                                showToast("⚠️ You cannot switch classrooms during exam!", "error");
                                return;
                              }
                              setSelectedClassroom(room); 
                              setClassroomView("exams"); 
                              setPendingExams(prev => ({ ...prev, [room._id]: false }));
                            }}
                            style={{ position: 'relative' }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                            Exams
                            {pendingExams[room._id] && (
                              <span style={{
                                position: 'absolute', top: '-5px', right: '-5px', width: '12px', height: '12px', 
                                background: '#ef4444', borderRadius: '50%', border: '2px solid white'
                              }}></span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px', color: '#64748b' }}>
                  <h3>You haven't joined any classrooms yet.</h3>
                  <p>Go to "Join Classroom" to get started!</p>
                </div>
              )}
            </div>
          )}

          {/* 3. Manage Classrooms */}
          {activeTab === 'manage' && (
             <div className="view-container fade-in">
              <header className="content-header">
                <h2 className="content-title">Manage Enrollments</h2>
                <p className="content-subtitle">Leave classrooms you no longer attend.</p>
              </header>
              <div className="manage-table-container">
                <table className="manage-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Class & Div</th>
                      <th>Teacher</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myClassrooms.map((room) => (
                      <tr key={room._id}>
                        <td>{room.subject}</td>
                        <td>{room.classGrade} - {room.division}</td>
                        <td>{room.teacherName}</td>
                        <td>
                          <button 
                            className="action-btn leave-btn"
                            onClick={() => initiateLeaveClassroom(room._id)}
                          >
                            <Icons.Leave /> Leave
                          </button>
                        </td>
                      </tr>
                    ))}
                    {myClassrooms.length === 0 && (
                       <tr>
                         <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8' }}>No active enrollments.</td>
                       </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Inside Classroom (Stream) */}
          {selectedClassroom && (
            <div className="view-container fade-in">
              <header className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h2 className="content-title">{selectedClassroom.subject}</h2>
                  <p className="content-subtitle">Taught by {selectedClassroom.teacherName}</p>
                </div>
                
                <div className="table-search" style={{ margin: 0, minWidth: '250px', flex: 1, maxWidth: '400px' }}>
                  <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div className="classroom-view-toggle">
                    <button
                      className={`view-toggle-btn ${classroomView === 'stream' ? 'active' : ''}`}
                      onClick={() => {
                        if (localStorage.getItem('isExamActive') === 'true') {
                          showToast("⚠️ You cannot switch views during exam!", "error");
                          return;
                        }
                        setClassroomView("stream");
                      }}
                    >
                      Stream
                    </button>
                    <button
                      className={`view-toggle-btn ${classroomView === 'exams' ? 'active' : ''}`}
                      onClick={() => {
                        if (localStorage.getItem('isExamActive') === 'true') {
                          showToast("⚠️ You cannot switch views during exam!", "error");
                          return;
                        }
                        setClassroomView("exams");
                        setPendingExams(prev => ({ ...prev, [selectedClassroom._id]: false }));
                      }}
                      style={{ position: 'relative' }}
                    >
                      Exams
                      {pendingExams[selectedClassroom._id] && (
                        <span style={{
                          position: 'absolute', top: '5px', right: '5px', width: '8px', height: '8px', 
                          background: '#ef4444', borderRadius: '50%'
                        }}></span>
                      )}
                    </button>
                  </div>
                  <button className="sidebar-btn" onClick={() => {
                    if (localStorage.getItem('isExamActive') === 'true') {
                      showToast("⚠️ You cannot leave during exam!", "error");
                      return;
                    }
                    setSelectedClassroom(null);
                  }}>
                    Back
                  </button>
                </div>
              </header>

              {/* Stream View */}
              {classroomView === "stream" && <div style={{ marginTop: '1rem' }}> 
                 {isLoading && posts.length === 0 ? (
                   <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading stream...</div>
                 ) : filteredPosts.length > 0 ? (
                  <div className="stream-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {filteredPosts.map(post => (
                      <div key={post._id} className="post-card" style={{ 
                        background: 'white', 
                        padding: '24px', 
                        borderRadius: '16px', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        borderLeft: post.isDeleted ? '4px solid #cbd5e1' : '4px solid #10b981'
                      }}>
                        {post.isDeleted ? (
                           <div style={{ color: '#94a3b8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <Icons.Delete /> This message is deleted by {post.deletedBy || 'Teacher'}
                           </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                              <h4 style={{ fontSize: '1.2rem', color: '#1a2b3c', margin: 0 }}>{post.title}</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                  {new Date(post.createdAt).toLocaleDateString()}
                                </span>
                                {post.isEdited && <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>(Edited)</span>}
                              </div>
                            </div>
                            <p style={{ color: '#334155', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>{post.description}</p>
                            
                            {/* Attachments */}
                            {post.files && post.files.length > 0 && (
                              <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {post.files.map((file, fIndex) => (
                                  <a key={fIndex} href={file.data} download={file.name} style={{ 
                                    border: '1px solid #e2e8f0', 
                                    borderRadius: '8px', 
                                    padding: '10px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '10px', 
                                    background: '#f8fafc',
                                    width: 'fit-content',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#f0f9ff'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                                  >
                                    <div style={{ 
                                      width: '40px', 
                                      height: '40px', 
                                      background: '#e0f2fe', 
                                      borderRadius: '8px', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      color: '#0284c7' 
                                    }}>
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                        <polyline points="13 2 13 9 20 9"></polyline>
                                      </svg>
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: '500', fontSize: '0.9rem', color: '#334155', wordBreak: 'break-all' }}>{file.name}</div>
                                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{file.size}</div>
                                      <div style={{ color: '#3b82f6', fontSize: '0.85rem', fontWeight: '600', marginTop: '2px', textTransform: 'uppercase' }}>Download</div>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            )}
                            
                            {post.videoLink && (
                              <div style={{ marginTop: '10px', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                                <a href={post.videoLink} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                                  Watch Video
                                </a>
                              </div>
                            )}
                            
                            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#94a3b8' }}>
                               <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
                                 {(cleanName(post.teacherName) || 'T').charAt(0)}
                               </div>
                               <span>Posted by {cleanName(post.teacherName)}</span>
                            </div>

                            {/* Student Upload Section */}
                            {post.allowStudentUpload && !post.isDeleted && (
                              <div style={{ 
                                marginTop: '24px', 
                                padding: '20px', 
                                background: '#eff6ff', 
                                borderRadius: '12px',
                                border: '1px solid #bfdbfe'
                              }}>
                                <h5 style={{ margin: '0 0 15px 0', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="8.5" cy="7" r="4"></circle>
                                    <line x1="20" y1="8" x2="20" y2="14"></line>
                                    <line x1="23" y1="11" x2="17" y2="11"></line>
                                  </svg> {hasExistingSubmission[post._id] ? 'Edit Your Submission' : 'Submit Your Work'}
                                </h5>

                                {hasExistingSubmission[post._id] && (
                                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                      <line x1="16" y1="2" x2="16" y2="6"></line>
                                      <line x1="8" y1="2" x2="8" y2="6"></line>
                                      <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg> Submitted on: {new Date(hasExistingSubmission[post._id]).toLocaleString()}
                                  </div>
                                )}
                                
                                <div className="form-group">
                                  <textarea 
                                    className="form-textarea"
                                    placeholder="Write a message to your teacher..."
                                    value={submissionMessage[post._id] || ''}
                                    onChange={(e) => setSubmissionMessage(prev => ({ ...prev, [post._id]: e.target.value }))}
                                    style={{ background: 'white', minHeight: '80px', fontSize: '0.95rem' }}
                                  />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                                  {(submissionFiles[post._id] || []).map((file, idx) => (
                                    <div key={idx} style={{ 
                                      background: 'white', padding: '8px 12px', borderRadius: '8px',
                                      border: '1px solid #d1d5db', display: 'flex', justifyContent: 'space-between',
                                      alignItems: 'center', fontSize: '0.85rem'
                                    }}>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                          <polyline points="13 2 13 9 20 9"></polyline>
                                        </svg> {file.name} ({file.size})
                                      </span>
                                      <button onClick={() => removeSubmissionFile(post._id, idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
                                    </div>
                                  ))}
                                </div>

                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <input 
                                    type="file" 
                                    id={`file-upload-${post._id}`} 
                                    multiple 
                                    className="hidden-file-input" 
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleSubmissionFileChange(e, post._id)}
                                  />
                                  <label htmlFor={`file-upload-${post._id}`} className="sidebar-btn" style={{ width: 'auto', background: 'white', border: '1px solid #3b82f6', color: '#3b82f6', marginBottom: 0 }}>
                                    Attach Files
                                  </label>
                                  <button 
                                    className="submit-btn" 
                                    style={{ width: 'auto', marginBottom: 0 }}
                                    onClick={() => handlePostSubmission(post._id)}
                                  >
                                    {hasExistingSubmission[post._id] ? 'Update Submission' : 'Submit Work'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    background: 'white', 
                    padding: '3rem', 
                    borderRadius: '16px', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    textAlign: 'center',
                    color: '#94a3b8'
                  }}>
                    No posts yet from your teacher.
                  </div>
                )}
              </div>}

              {/* Exams View */}
              {classroomView === "exams" && <div style={{ marginTop: '1rem' }}>
                <StudentExams classroom={selectedClassroom} studentData={userData} postSearch={postSearch} />
              </div>}
            </div>
          )}

        </main>
      </div>

      <NotificationModal 
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        title={notification.title}
        message={notification.message}
        buttonText={notification.buttonText}
        type={notification.type}
      />

      <ConfirmationModal 
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
        onConfirm={handleConfirmAction}
        title={confirmation.title}
        message={confirmation.message}
        isDanger={confirmation.isDanger}
        confirmText={confirmation.confirmText}
      />
    </>
  );
};

export default StudentClassroom;
