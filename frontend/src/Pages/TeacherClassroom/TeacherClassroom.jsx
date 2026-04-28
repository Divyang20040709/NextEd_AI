import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/Navbar/Navbar";
import NotificationModal from "../../Components/NotificationModal/NotificationModal";
import ConfirmationModal from "../../Components/ConfirmationModal/ConfirmationModal";
import { authAPI, classroomAPI, postAPI, notifyAuthChange } from "../../utils/api";

import { socket, connectSocket, disconnectSocket } from "../../utils/socket";
import "./TeacherClassroom.css";
import TeacherExams from "./TeacherExams";

// SVGs for Icons
const Icons = {
  Create: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  MyClass: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Manage: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  Logout: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Delete: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
  Trash: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Menu: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Close: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

const TeacherClassroom = () => {
  const navigate = useNavigate();
  
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setNotification({
      isOpen: true,
      title: "Code Copied!",
      message: "Classroom code has been copied to your clipboard.",
      type: "success"
    });
  };

  const [activeTab, setActiveTab] = useState("my-classroom"); // Default view
  const [selectedClassroom, setSelectedClassroom] = useState(null); // For inside view
  const [classroomView, setClassroomView] = useState("manage-posts"); // 'manage-posts' or 'create-post'
  const selectedClassroomRef = useRef(null);

  useEffect(() => {
    selectedClassroomRef.current = selectedClassroom;
  }, [selectedClassroom]);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false); // Mobile Nav State
  const [selectedFiles, setSelectedFiles] = useState([]); // File state
  const [editingPost, setEditingPost] = useState(null); // Track which post is being edited
  const [postSearch, setPostSearch] = useState(''); // Search query for posts
  const [allowStudentUpload, setAllowStudentUpload] = useState(false); // Flag for new post
  const [viewingSubmissions, setViewingSubmissions] = useState(null); // Post for which submissions are shown
  const [submissions, setSubmissions] = useState([]); // List of student submissions

  // Modal States
  const [notification, setNotification] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
  });
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    type: "",
    id: null,
    title: "",
    message: "",
  });

  // Student List Modal States
  const [studentsModal, setStudentsModal] = useState({
    isOpen: false,
    roomName: "",
    students: [],
  });


  // State Management
  const [classrooms, setClassrooms] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get teacher session data
  const userData = (() => {
    const saved = localStorage.getItem("user_data");
    return saved ? JSON.parse(saved) : null;
  })();

  const teacherEmail = userData?.email;
  const teacherName = userData?.name || "Teacher";

  // Helper to clean legacy teacherName values that have 'undefined' appended
  const cleanName = (name) =>
    name ? name.replace(/ undefined$/, "").trim() : name;

  // Form State
  const [formData, setFormData] = useState({
    subject: "",
    classGrade: "",
    division: "",
    teacherName: teacherName,
  });

  // Fetch classrooms - extracted so it can be called to refresh
  const fetchClassrooms = async () => {
    if (!teacherEmail) return;
    setIsLoading(true);
    const result = await classroomAPI.getTeacherClassrooms(teacherEmail);
    if (result.success) {
      setClassrooms(result.data.classrooms);
    } else {
      setNotification({
        isOpen: true,
        title: "Error",
        message: result.message,
        type: "error",
      });
    }
    setIsLoading(false);
  };

  // Fetch classrooms on mount
  useEffect(() => {
    fetchClassrooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherEmail]);

  // Re-fetch when switching to manage tab so student count is always fresh
  useEffect(() => {
    if (activeTab === "manage") {
      fetchClassrooms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Fetch posts when classroom is selected
  useEffect(() => {
    const fetchPosts = async () => {
      if (!selectedClassroom) return;

      setIsLoading(true);
      const result = await postAPI.getClassroomPosts(selectedClassroom._id);

      if (result.success) {
        setPosts(result.data.posts);
      } else {
        setNotification({
          isOpen: true,
          title: "Error",
          message: result.message,
          type: "error",
        });
      }
      setIsLoading(false);
    };

    fetchPosts();
  }, [selectedClassroom]);

  useEffect(() => {
    if (teacherEmail) {
      connectSocket(teacherEmail);

      const handleStatusUpdate = (data) => {
        console.log("Real-time status update received:", data);

        if (data.status === "banned" || data.status === "deleted") {
          // Preserve metadata but clear active session
          const storedData = localStorage.getItem("user_data");
          if (storedData) {
            const upDatedData = JSON.parse(storedData);
            upDatedData.isLoggedIn = false;
            localStorage.setItem("user_data", JSON.stringify(upDatedData));
          }

          // Remove auth tokens
          localStorage.removeItem("teacher_token");
          localStorage.removeItem("preferredRole");
          localStorage.removeItem("has_approval_update");

          // Trigger navbar/storage listeners
          notifyAuthChange();


          // Show ban/delete confirmation popup — user must click to proceed
          const isBanned = data.status === "banned";
          setConfirmation({
            isOpen: true,
            type: isBanned ? "_ban_redirect" : "_delete_redirect",
            title: isBanned ? "🚫 Account Suspended" : "⚠️ Account Deleted",
            message: isBanned
              ? "Your account has been banned by the admin. Please contact the admin to get your account unbanned."
              : data.message || "Your account has been deleted by an admin.",
            isDanger: true,
            confirmText: "Yes, I Understand",
          });
        } else if (data.status === "rejected") {
          // Completely clear all data to allow fresh signup
          localStorage.removeItem("user_data");
          localStorage.removeItem("preferredRole");

          setNotification({
            isOpen: true,
            title: "Application Rejected",
            message:
              data.message ||
              "Your application was rejected. You can try signing up again.",
            type: "error",
          });

          setTimeout(() => {
            navigate("/signup");
            disconnectSocket();
          }, 5000); // Give user more time to read rejection reason
        } else if (data.status === "approved") {
          setNotification({
            isOpen: true,
            title: "Account Restored",
            message: data.message || "Your account has been unbanned.",
            type: "success",
          });
        }
      };

      socket.on("teacher-status-updated", handleStatusUpdate);

      socket.on("classroom-deleted", (data) => {
        setNotification({
          isOpen: true,
          title: "Classroom Removed",
          message: data.message,
          type: "warning",
        });
        fetchClassrooms();
        if (selectedClassroomRef.current?._id === data.classroomId) {
          setSelectedClassroom(null);
          setActiveTab("my-classroom");
        }
      });

      socket.on("post-added", (data) => {
        if (selectedClassroomRef.current?._id === data.classroomId) {
          setPosts((prev) => [data.post, ...prev]);
        }
      });

      socket.on("post-updated", (data) => {
        setPosts((prev) =>
          prev.map((p) => (p._id === data.postId ? data.post : p)),
        );
      });

      socket.on("post-deleted", (data) => {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === data.postId
              ? { ...p, isDeleted: true, deletedBy: data.deletedBy }
              : p,
          ),
        );
      });

      return () => {
        socket.off('teacher-status-updated', handleStatusUpdate);
        socket.off('classroom-deleted');
        socket.off('post-added');
        socket.off('post-updated');
        socket.off('post-deleted');
        // Do NOT disconnect socket on unmount — if the teacher was just banned,
        // the socket must stay connected so the login page can receive the unban event.
      };
    }
  }, [teacherEmail, navigate]);

  // Handle Input Change
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map((file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () =>
            resolve({
              name: file.name,
              type: file.type,
              size: (file.size / 1024).toFixed(2) + " KB",
              data: reader.result, // Base64 for simulation
            });
          reader.onerror = (error) => reject(error);
        });
      });

      Promise.all(filesArray).then((files) => {
        // Limit to prevent LocalStorage crash (simple check)
        const validFiles = files.filter((f) => f.data.length < 20000000); // < 15MB (approx 20M chars for base64)
        if (files.length !== validFiles.length) {
          setNotification({
            isOpen: true,
            title: "File too large",
            message:
              "Some files were skipped because they exceed the 15MB limit.",
            type: "warning",
          });
        }
        setSelectedFiles([...selectedFiles, ...validFiles]);
      });
    }
  };

  // Remove File
  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  // Create Classroom
  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const classroomData = {
      subject: formData.subject,
      classGrade: formData.classGrade,
      division: formData.division,
      teacherEmail,
      teacherName: formData.teacherName || teacherName,
    };

    const result = await classroomAPI.createClassroom(classroomData);

    if (result.success) {
      const newClassroom = result.data.classroom;
      setClassrooms([...classrooms, newClassroom]);

      setNotification({
        isOpen: true,
        title: "Classroom Created!",
        message: `Your new classroom for ${newClassroom.subject} has been created successfully. Code: ${newClassroom.code}`,
        type: "success",
        buttonText: "Awesome!",
      });

      setActiveTab("my-classroom");
      setFormData({
        subject: "",
        classGrade: "",
        division: "",
        teacherName: "",
      });
    } else {
      setNotification({
        isOpen: true,
        title: "Error",
        message: result.message,
        type: "error",
      });
    }

    setIsLoading(false);
    setIsMobileNavOpen(false);
  };

  // Delete Classroom Logic
  const initiateDeleteClassroom = (id) => {
    setConfirmation({
      isOpen: true,
      type: "delete-class",
      id: id,
      title: "Delete Classroom?",
      message:
        "This will permanently remove the classroom and all associated data. Are you sure?",
      isDanger: true,
    });
  };

  // Delete Post Logic (Soft Delete)
  const initiateDeletePost = (postId) => {
    setConfirmation({
      isOpen: true,
      type: "delete-post",
      id: postId,
      title: "Delete Message?",
      message:
        'This message will be hidden from students. They will see "This message is deleted by Teacher".',
      isDanger: true,
      confirmText: "Delete",
    });
  };

  // Edit Post Logic
  const startEditingPost = (post) => {
    setEditingPost({
      ...post,
      files: post.files ? [...post.files] : [],
    });
  };

  const cancelEditingPost = () => {
    setEditingPost(null);
  };

  // Handle File Addition during Edit
  const handleEditFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map((file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () =>
            resolve({
              name: file.name,
              type: file.type,
              size: (file.size / 1024).toFixed(2) + " KB",
              data: reader.result,
            });
          reader.onerror = (error) => reject(error);
        });
      });

      Promise.all(filesArray).then((files) => {
        const validFiles = files.filter((f) => f.data.length < 20000000);
        if (files.length !== validFiles.length) {
          setNotification({
            isOpen: true,
            title: "File too large",
            message: "Some files were skipped as they exceed the 15MB limit.",
            type: "warning",
          });
        }
        setEditingPost((prev) => ({
          ...prev,
          files: [...prev.files, ...validFiles],
        }));
      });
    }
  };

  // Remove File from Edit State
  const removeEditFile = (index) => {
    setEditingPost((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const saveEditedPost = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const postData = {
      title: editingPost.title,
      description: editingPost.description,
      videoLink: editingPost.videoLink,
      files: editingPost.files,
    };

    const result = await postAPI.updatePost(editingPost._id, postData);

    if (result.success) {
      // Refresh posts
      const postsResult = await postAPI.getClassroomPosts(
        selectedClassroom._id,
      );
      if (postsResult.success) {
        setPosts(postsResult.data.posts);
      }

      setEditingPost(null);
      setNotification({
        isOpen: true,
        title: "Updated",
        message: "Post has been updated successfully.",
        type: "success",
      });
    } else {
      setNotification({
        isOpen: true,
        title: "Error",
        message: result.message,
        type: "error",
      });
    }

    setIsLoading(false);
  };

  // Logout Logic
  const initiateLogout = () => {
    setConfirmation({
      isOpen: true,
      type: "logout",
      title: "Confirm Logout",
      message: "Are you sure you want to log out? Your data will be saved.",
      isDanger: false,
      confirmText: "Logout",
    });
    setIsMobileNavOpen(false);
  };

  // Delete Account Logic
  const initiateDeleteAccount = () => {
    setConfirmation({
      isOpen: true,
      type: "delete-account",
      title: "Delete Account",
      message:
        "This action cannot be undone. All your classrooms and data will be permanently deleted.",
      isDanger: true,
      confirmText: "Delete Forever",
    });
    setIsMobileNavOpen(false);
  };

  // Confirm Action Handler
  const handleConfirmAction = async () => {
    if (confirmation.type === '_ban_redirect' || confirmation.type === '_delete_redirect') {
      // Teacher acknowledged ban/delete — redirect to login.
      // Do NOT disconnect socket here — socket must stay alive so the login
      // page Navbar can receive the unban 'approved' event and show the red dot.
      setConfirmation({ ...confirmation, isOpen: false });
      navigate('/login');
      return;
    }

    if (confirmation.type === "delete-class") {
      setIsLoading(true);
      const result = await classroomAPI.deleteClassroom(
        confirmation.id,
        teacherEmail,
      );

      if (result.success) {
        setClassrooms(classrooms.filter((c) => c._id !== confirmation.id));
        setNotification({
          isOpen: true,
          title: "Deleted",
          message: "Classroom has been deleted.",
        });
      } else {
        setNotification({
          isOpen: true,
          title: "Error",
          message: result.message,
          type: "error",
        });
      }
      setIsLoading(false);
    } else if (confirmation.type === "delete-post") {
      setIsLoading(true);
      const result = await postAPI.deletePost(confirmation.id, teacherName);

      if (result.success) {
        // Refresh posts
        const postsResult = await postAPI.getClassroomPosts(
          selectedClassroom._id,
        );
        if (postsResult.success) {
          setPosts(postsResult.data.posts);
        }
        setNotification({
          isOpen: true,
          title: "Deleted",
          message: "Message marked as deleted.",
        });
      } else {
        setNotification({
          isOpen: true,
          title: "Error",
          message: result.message,
          type: "error",
        });
      }
      setIsLoading(false);
    } else if (confirmation.type === "logout") {
      // Call backend logout API
      const storedData = localStorage.getItem("user_data");
      if (storedData) {
        const userData = JSON.parse(storedData);
        await authAPI.logout(userData.email, "teacher");
        userData.isLoggedIn = false;
        localStorage.setItem("user_data", JSON.stringify(userData));
      }
      navigate("/homepage");
    } else if (confirmation.type === "delete-account") {
      // Call backend delete account API
      const storedData = localStorage.getItem("user_data");
      if (storedData) {
        const userData = JSON.parse(storedData);
        const result = await authAPI.deleteAccount(userData.email, "teacher");

        if (result.success) {
          // Clear all local data
          localStorage.removeItem("user_data");
          localStorage.removeItem("preferredRole");
          navigate("/homepage");
        } else {
          setNotification({
            isOpen: true,
            title: "Error",
            message: result.message,
            type: "error",
          });
        }
      }
    }
    setConfirmation({ ...confirmation, isOpen: false });
  };

  const toggleMobileNav = () => setIsMobileNavOpen(!isMobileNavOpen);

  return (
    <>
      <Navbar />
      <div className="flex-dashboard-wrapper">
        {/* Mobile Menu Toggle */}
        <button className="mobile-menu-toggle" onClick={toggleMobileNav}>
          {isMobileNavOpen ? <Icons.Close /> : <Icons.Menu />}
        </button>

        {/* Mobile Overlay Backdrop */}
        <div
          className={`mobile-nav-overlay ${isMobileNavOpen ? "active" : ""}`}
          onClick={() => setIsMobileNavOpen(false)}
        ></div>

        {/* Left Sidebar */}
        <aside
          className={`floating-sidebar ${isMobileNavOpen ? "mobile-open" : ""}`}
        >
          <div className="sidebar-header">
            <h3>Menu</h3>
            <button
              className="close-btn-mobile"
              onClick={() => setIsMobileNavOpen(false)}
            >
              <Icons.Close />
            </button>
          </div>

          <nav className="sidebar-menu">
            <button
              className={`sidebar-btn ${activeTab === "create" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("create");
                setSelectedClassroom(null);
                setIsMobileNavOpen(false);
              }}
            >
              <Icons.Create /> Create Classroom
            </button>
            <button
              className={`sidebar-btn ${activeTab === "my-classroom" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("my-classroom");
                setSelectedClassroom(null);
                setIsMobileNavOpen(false);
              }}
            >
              <Icons.MyClass /> My Classroom
            </button>
            <button
              className={`sidebar-btn ${activeTab === "manage" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("manage");
                setSelectedClassroom(null);
                setIsMobileNavOpen(false);
              }}
            >
              <Icons.Manage /> Manage Classroom
            </button>
          </nav>

          {/* Teacher Profile Section */}
          {userData && (
            <div className="sidebar-profile">
              <div className="profile-name">{teacherName}</div>
              <div className="profile-email">{teacherEmail}</div>
            </div>
          )}

          <div className="sidebar-footer">
            <button className="sidebar-btn logout-btn" onClick={initiateLogout}>
              <Icons.Logout /> Logout
            </button>
            <button
              className="sidebar-btn delete-account-btn"
              onClick={initiateDeleteAccount}
            >
              <Icons.Delete /> Delete My Account
            </button>
          </div>
        </aside>

        {/* Right Main Content */}
        <main className="floating-content-area">
          {/* 1. Create Classroom View */}
          {activeTab === "create" && (
            <div className="view-container fade-in">
              <header className="content-header">
                <h2 className="content-title">Create New Classroom</h2>
                <p className="content-subtitle">
                  Set up a new space for your students.
                </p>
              </header>
              <div className="form-card-dashboard">
                <form onSubmit={handleCreateClassroom}>
                  <div className="form-group">
                    <label>Subject Name</label>
                    <input
                      type="text"
                      name="subject"
                      className="form-input"
                      placeholder="e.g. Mathematics"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <div style={{ display: "flex", gap: "20px" }}>
                      <div style={{ flex: 1 }}>
                        <label>Class / Grade</label>
                        <input
                          type="text"
                          name="classGrade"
                          className="form-input"
                          placeholder="e.g. 10"
                          value={formData.classGrade}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label>Division</label>
                        <input
                          type="text"
                          name="division"
                          className="form-input"
                          placeholder="e.g. A"
                          value={formData.division}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Teacher's Name</label>
                    <input
                      type="text"
                      name="teacherName"
                      className="form-input"
                      placeholder="e.g. Mr. Sharma"
                      value={formData.teacherName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <button type="submit" className="submit-btn">
                    Create Classroom
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 2. My Classroom View (List of Cards) */}
          {activeTab === "my-classroom" && !selectedClassroom && (
            <div className="view-container fade-in">
              <header className="content-header">
                <h2 className="content-title">My Classrooms</h2>
                <p className="content-subtitle">
                  Access and manage your active classes.
                </p>
              </header>
              <div className="classroom-grid">
                {classrooms.map((room) => (
                  <div key={room.id} className="classroom-card">
                    <div className="card-header-gradient">
                      <h3 className="card-subject">{room.subject}</h3>
                      <div className="card-details">
                        Class {room.classGrade} - {room.division}
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="teacher-name">{room.teacher}</div>
                      <div className="class-code-row-v2">
                        <div className="code-display-column">
                          <div className="code-badge-v2">
                            <span>{room.code}</span>
                            <button 
                              className="copy-code-icon-btn" 
                              onClick={() => handleCopyCode(room.code)}
                              title="Copy Code"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            </button>
                          </div>
                        </div>
                        
                        <div className="students-action-column">
                          <button 
                            className="card-action-btn card-action-btn--secondary"
                            style={{ width: '100%', margin: 0, height: '42px', fontSize: '14px' }}
                            onClick={() => setStudentsModal({
                              isOpen: true,
                              roomName: room.subject,
                              students: room.students || []
                            })}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            Students
                          </button>
                        </div>
                      </div>


                      <div className="classroom-card-actions">
                        <button
                          className="card-action-btn card-action-btn--secondary"
                          onClick={() => { setSelectedClassroom(room); setClassroomView("manage-posts"); }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                          Manage Posts
                        </button>
                        <button
                          className="card-action-btn card-action-btn--secondary"
                          onClick={() => { setSelectedClassroom(room); setClassroomView("exams"); }}
                          style={{ marginLeft: "5px", marginRight: "5px" }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                          Exams
                        </button>
                        <button
                          className="card-action-btn card-action-btn--primary"
                          onClick={() => { setSelectedClassroom(room); setClassroomView("create-post"); }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Create Post
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Manage Classroom View */}
          {activeTab === "manage" && (
            <div className="view-container fade-in">
              <header className="content-header">
                <h2 className="content-title">Manage Classrooms</h2>
                <p className="content-subtitle">
                  Delete your existing classrooms.
                </p>
              </header>
              <div className="manage-table-container">
                <table className="manage-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Class & Div</th>
                      <th>Teacher</th>
                      <th>Students</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classrooms.map((room) => (
                      <tr key={room._id}>
                        <td>{room.subject}</td>
                        <td>
                          {room.classGrade} - {room.division}
                        </td>
                        <td>{room.teacherName}</td>
                        <td>
                          {Array.isArray(room.students)
                            ? room.students.length
                            : 0}
                        </td>
                        <td>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => initiateDeleteClassroom(room._id)}
                          >
                            <Icons.Trash /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Inside Classroom Workspace */}
          {selectedClassroom && (
            <div className="view-container fade-in">
              <header
                className="content-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <h2 className="content-title">
                    {selectedClassroom.subject} Workspace
                  </h2>
                  <p className="content-subtitle">
                    Class {selectedClassroom.classGrade}-
                    {selectedClassroom.division} • Code:{" "}
                    {selectedClassroom.code}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <div className="classroom-view-toggle">
                    <button
                      className={`view-toggle-btn ${classroomView === 'manage-posts' ? 'active' : ''}`}
                      onClick={() => setClassroomView("manage-posts")}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                      Manage Posts
                    </button>
                    <button
                      className={`view-toggle-btn ${classroomView === 'exams' ? 'active' : ''}`}
                      onClick={() => setClassroomView("exams")}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                      Exams
                    </button>
                    <button
                      className={`view-toggle-btn ${classroomView === 'create-post' ? 'active' : ''}`}
                      onClick={() => setClassroomView("create-post")}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Create Post
                    </button>
                  </div>
                  <button
                    className="sidebar-btn"
                    onClick={() => setSelectedClassroom(null)}
                  >
                    ← Back
                  </button>
                </div>
              </header>

              {/* Post Content Form — shown only in create-post mode */}
              {classroomView === "create-post" && <div className="form-card-dashboard">
                <h3 className="form-section-title">Share with your class</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const title = e.target.postTitle.value;
                    const desc = e.target.postDesc.value;
                    const videoLink = e.target.postVideo.value;

                    if (!title && !desc) return;

                    setIsLoading(true);

                    const postData = {
                      classroomId: selectedClassroom._id,
                      title,
                      description: desc,
                      videoLink,
                      files: selectedFiles,
                      teacherName,
                      allowStudentUpload,
                    };

                    const result = await postAPI.createPost(postData);

                    if (result.success) {
                      // Refresh posts
                      const postsResult = await postAPI.getClassroomPosts(
                        selectedClassroom._id,
                      );
                      if (postsResult.success) {
                        setPosts(postsResult.data.posts);
                      }

                      e.target.reset();
                      setSelectedFiles([]);
                      setNotification({
                        isOpen: true,
                        title: "Posted!",
                        message: "Your message has been posted to the stream.",
                        type: "success",
                        buttonText: "Done",
                      });
                      setAllowStudentUpload(false);
                    } else {
                      setNotification({
                        isOpen: true,
                        title: "Error",
                        message: result.message,
                        type: "error",
                      });
                    }

                    setIsLoading(false);
                  }}
                >
                  <div className="form-group">
                    <input
                      name="postTitle"
                      type="text"
                      className="form-input"
                      placeholder="Title of your post / material"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <textarea
                      name="postDesc"
                      className="form-textarea"
                      placeholder="Description or instructions..."
                      required
                    ></textarea>
                  </div>

                  {/* File Upload Section */}
                  <div
                    className="file-upload-section"
                    onClick={() => document.getElementById("fileInput").click()}
                  >
                    <input
                      id="fileInput"
                      type="file"
                      multiple
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                    <p style={{ color: "#64748b" }}>
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ marginBottom: "-6px", marginRight: "8px" }}
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Click to Upload Files
                    </p>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "#94a3b8",
                        marginTop: "0.5rem",
                      }}
                    >
                      Supported Types: Images, PDF, Docs (Max 15MB per file)
                    </p>
                  </div>

                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "10px",
                        marginBottom: "20px",
                      }}
                    >
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          style={{
                            background: "#f1f5f9",
                            padding: "8px 12px",
                            borderRadius: "20px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "0.9rem",
                            color: "#334155",
                          }}
                        >
                          <span>📄 {file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "#ef4444",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "10px", fontWeight: "600", color: "#334155" }}>
                      Let Students Upload File?
                    </label>
                    <div style={{ display: "flex", gap: "20px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <input 
                          type="radio" 
                          name="allowUpload" 
                          checked={allowStudentUpload === true} 
                          onChange={() => setAllowStudentUpload(true)}
                          style={{ width: "18px", height: "18px", accentColor: "#3b82f6" }}
                        /> 
                        <span>Yes, allow submissions</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <input 
                          type="radio" 
                          name="allowUpload" 
                          checked={allowStudentUpload === false} 
                          onChange={() => setAllowStudentUpload(false)}
                          style={{ width: "18px", height: "18px", accentColor: "#3b82f6" }}
                        /> 
                        <span>No, regular post</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <input
                      name="postVideo"
                      type="text"
                      className="form-input"
                      placeholder="Add Video Link (YouTube URL)"
                    />
                  </div>

                  <button
                    type="submit"
                    className="submit-btn"
                    style={{ width: "auto", padding: "12px 40px" }}
                  >
                    Post to Stream
                  </button>
                </form>
              </div>}

              {/* Real Stream — shown only in manage-posts mode */}
              {classroomView === "manage-posts" && <div style={{ marginTop: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "15px" }}>
                  <h3 style={{ margin: 0, color: "#334155" }}>
                    Class Stream
                  </h3>
                  
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
                </div>

                {isLoading && posts.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      color: "#64748b",
                    }}
                  >
                    Loading stream...
                  </div>
                ) : posts.length > 0 ? (
                  <div
                    className="stream-container"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "20px",
                    }}
                  >
                    {posts.filter(post => 
                      (post.title || '').toLowerCase().includes(postSearch.toLowerCase()) || 
                      (post.description || '').toLowerCase().includes(postSearch.toLowerCase())
                    ).map((post) => (
                      <div
                        key={post._id}
                        className="post-card"
                        style={{
                          background: "white",
                          padding: "24px",
                          borderRadius: "16px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                          borderLeft: "4px solid #3b82f6",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "12px",
                          }}
                        >
                          <h4
                            style={{
                              fontSize: "1.2rem",
                              color: "#1a2b3c",
                              margin: 0,
                            }}
                          >
                            {post.title}
                          </h4>
                          <span
                            style={{ fontSize: "0.9rem", color: "#64748b" }}
                          >
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p
                          style={{
                            color: "#334155",
                            marginBottom: "16px",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {post.description}
                        </p>

                        {/* Attachments */}
                        {post.files && post.files.length > 0 && (
                          <div
                            style={{
                              marginBottom: "16px",
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "10px",
                            }}
                          >
                            {post.files.map((file, fIndex) => (
                              <a
                                key={fIndex}
                                href={file.data}
                                download={file.name}
                                style={{
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "8px",
                                  padding: "10px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  background: "#f8fafc",
                                  width: "fit-content",
                                  textDecoration: "none",
                                  transition: "all 0.2s ease",
                                  cursor: "pointer",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = "#3b82f6";
                                  e.currentTarget.style.background = "#f0f9ff";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = "#e2e8f0";
                                  e.currentTarget.style.background = "#f8fafc";
                                }}
                              >
                                <div
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    background: "#e0f2fe",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#0284c7",
                                  }}
                                >
                                  <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                    <polyline points="13 2 13 9 20 9"></polyline>
                                  </svg>
                                </div>
                                <div>
                                  <div
                                    style={{
                                      fontWeight: "500",
                                      fontSize: "0.9rem",
                                      color: "#334155",
                                      wordBreak: "break-all",
                                    }}
                                  >
                                    {file.name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.8rem",
                                      color: "#94a3b8",
                                    }}
                                  >
                                    {file.size}
                                  </div>
                                  <div
                                    style={{
                                      color: "#3b82f6",
                                      fontSize: "0.85rem",
                                      fontWeight: "600",
                                      marginTop: "2px",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    Download
                                  </div>
                                </div>
                              </a>
                            ))}
                          </div>
                        )}

                        {post.videoLink && (
                          <div
                            style={{
                              marginTop: "10px",
                              padding: "10px",
                              background: "#f8fafc",
                              borderRadius: "8px",
                            }}
                          >
                            <a
                              href={post.videoLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#3b82f6",
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <polygon points="10 8 16 12 10 16 10 8" />
                              </svg>
                              Watch Video
                            </a>
                          </div>
                        )}

                        <div
                          style={{
                            marginTop: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "0.9rem",
                              color: "#94a3b8",
                            }}
                          >
                            <div
                              style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                background: "#cbd5e1",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "bold",
                                color: "white",
                              }}
                            >
                              {(cleanName(post.teacherName) || "T").charAt(0)}
                            </div>
                            <span>Posted by {cleanName(post.teacherName)}</span>
                            {post.isEdited && (
                              <span
                                style={{
                                  fontStyle: "italic",
                                  fontSize: "0.8rem",
                                }}
                              >
                                (Edited)
                              </span>
                            )}
                          </div>

                          {/* Edit/Delete/Submissions Actions */}
                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            {post.allowStudentUpload && !post.isDeleted && (
                              <button
                                onClick={async () => {
                                  setViewingSubmissions(post);
                                  setIsLoading(true);
                                  const result = await postAPI.getPostSubmissions(post._id);
                                  if (result.success) {
                                    setSubmissions(result.data.submissions);
                                  }
                                  setIsLoading(false);
                                }}
                                style={{
                                  background: "#eff6ff",
                                  color: "#2563eb",
                                  border: "1px solid #bfdbfe",
                                  padding: "6px 12px",
                                  borderRadius: "8px",
                                  fontSize: "0.85rem",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px"
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                  <polyline points="7 10 12 15 17 10"></polyline>
                                  <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg> Submissions
                              </button>
                            )}
                            {!post.isDeleted && (
                              <>
                                <button
                                  onClick={() => startEditingPost(post)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#64748b",
                                  }}
                                  title="Edit"
                                >
                                  <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => initiateDeletePost(post._id)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#ef4444",
                                  }}
                                  title="Delete"
                                >
                                  <Icons.Trash />
                                </button>
                              </>
                            )}
                            {post.isDeleted && (
                              <div
                                style={{
                                  color: "#ef4444",
                                  fontSize: "0.9rem",
                                  fontWeight: "500",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "5px",
                                }}
                              >
                                <Icons.Trash /> This message is deleted by{" "}
                                {post.deletedBy}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Edit Modal / Inline Edit */}
                        {editingPost && editingPost._id === post._id && (
                          <div
                            className="fixed-edit-overlay"
                            style={{
                              position: "fixed",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: "rgba(0,0,0,0.5)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              zIndex: 1000,
                            }}
                          >
                            <div
                              style={{
                                background: "white",
                                padding: "2rem",
                                borderRadius: "16px",
                                width: "90%",
                                maxWidth: "500px",
                              }}
                            >
                              <h3>Edit Post</h3>
                              <form onSubmit={saveEditedPost}>
                                <div className="form-group">
                                  <label>Title</label>
                                  <input
                                    className="form-input"
                                    value={editingPost.title}
                                    onChange={(e) =>
                                      setEditingPost({
                                        ...editingPost,
                                        title: e.target.value,
                                      })
                                    }
                                    required
                                  />
                                </div>
                                <div className="form-group">
                                  <label>Description</label>
                                  <textarea
                                    className="form-textarea"
                                    value={editingPost.description}
                                    onChange={(e) =>
                                      setEditingPost({
                                        ...editingPost,
                                        description: e.target.value,
                                      })
                                    }
                                    required
                                  />
                                </div>

                                {/* Edit Files */}
                                <div className="form-group">
                                  <label>Attachments</label>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "8px",
                                      marginBottom: "12px",
                                    }}
                                  >
                                    {editingPost.files &&
                                      editingPost.files.map((file, idx) => (
                                        <div
                                          key={idx}
                                          style={{
                                            border: "1px solid #e2e8f0",
                                            borderRadius: "8px",
                                            padding: "10px 14px",
                                            background: "#fff",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            fontSize: "0.9rem",
                                            color: "#334155",
                                            boxShadow:
                                              "0 1px 2px rgba(0,0,0,0.05)",
                                          }}
                                        >
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "10px",
                                            }}
                                          >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-blue)' }}>
                                              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                              <polyline points="13 2 13 9 20 9"></polyline>
                                            </svg>
                                            <span>{file.name}</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => removeEditFile(idx)}
                                            style={{
                                              border: "none",
                                              background: "#fee2e2",
                                              color: "#ef4444",
                                              cursor: "pointer",
                                              borderRadius: "50%",
                                              width: "24px",
                                              height: "24px",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              fontSize: "1.1rem",
                                              lineHeight: "1",
                                            }}
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                  </div>

                                  <input
                                    type="file"
                                    id="edit-file-upload"
                                    multiple
                                    style={{ display: "none" }}
                                    onChange={handleEditFileChange}
                                  />
                                  <label
                                    htmlFor="edit-file-upload"
                                    className="choose-file-btn"
                                  >
                                    Choose Files
                                  </label>
                                </div>

                                {/* Edit Video */}
                                <div className="form-group">
                                  <label>Video Link</label>
                                  <input
                                    className="form-input"
                                    value={editingPost.videoLink || ""}
                                    onChange={(e) =>
                                      setEditingPost({
                                        ...editingPost,
                                        videoLink: e.target.value,
                                      })
                                    }
                                    placeholder="https://youtube.com/..."
                                  />
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    gap: "1rem",
                                    marginTop: "1rem",
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={cancelEditingPost}
                                    style={{
                                      padding: "8px 16px",
                                      border: "1px solid #ccc",
                                      borderRadius: "8px",
                                      background: "transparent",
                                    }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    className="submit-btn"
                                    style={{ width: "auto" }}
                                  >
                                    Save Changes
                                  </button>
                                </div>
                              </form>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="empty-stream"
                    style={{
                      textAlign: "center",
                      padding: "3rem",
                      background: "#f8fafc",
                      borderRadius: "16px",
                      border: "2px dashed #e2e8f0",
                    }}
                  >
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#cbd5e1', marginBottom: '16px' }}>
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <h4 style={{ color: "#64748b" }}>
                      No posts yet. Share something with your class!
                    </h4>
                  </div>
                )}
              </div>}

              {/* Exams View */}
              {classroomView === "exams" && <div style={{ marginTop: "1.5rem" }}>
                <TeacherExams classroom={selectedClassroom} teacherEmail={teacherEmail} teacherName={teacherName} />
              </div>}
            </div>
          )}
        </main>
      </div>

      {/* Submissions View Modal */}
      {viewingSubmissions && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setViewingSubmissions(null)}>
          <div className="modal" style={{ maxWidth: '850px', borderRadius: '32px', border: '1px solid rgba(16, 137, 211, 0.1)', overflow: 'hidden' }}>
            <div className="modal-header" style={{ 
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
              padding: '24px 32px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div className="modal-header-left">
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>Student Submissions</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{viewingSubmissions.title}</span>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                  <span style={{ 
                    padding: '4px 12px', 
                    background: 'white', 
                    color: 'var(--primary-blue)', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: '800',
                    border: '1px solid rgba(16, 137, 211, 0.1)',
                    boxShadow: '0 2px 4px rgba(16, 137, 211, 0.05)'
                  }}>{submissions.length} Total Submissions</span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setViewingSubmissions(null)} style={{ 
                background: 'white',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
              }}>
                <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#64748b"/></svg>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '36px', maxHeight: '70vh', overflowY: 'auto', background: '#fcfdfe' }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                  <div className="loading-spinner" style={{ 
                    margin: '0 auto 20px auto', 
                    width: '48px', 
                    height: '48px', 
                    border: '4px solid #f1f5f9', 
                    borderTopColor: 'var(--primary-blue)', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite' 
                  }}></div>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '16px', fontWeight: '500' }}>Fetching latest student work...</p>
                </div>
              ) : submissions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {submissions.map((sub, idx) => (
                    <div key={idx} className="submission-card-premium" style={{ 
                      padding: '24px', 
                      background: 'white', 
                      borderRadius: '20px',
                      border: '1px solid #eef2f6',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 20px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = 'rgba(16, 137, 211, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)'; e.currentTarget.style.borderColor = '#eef2f6'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '16px', 
                            background: 'linear-gradient(135deg, var(--primary-blue), var(--secondary-blue))', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '20px', 
                            color: 'white', 
                            fontWeight: '800'
                          }}>
                            {sub.studentName?.charAt(0)}
                          </div>
                          <div>
                            <h5 style={{ margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: '800' }}>{sub.studentName}</h5>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Submitted on</span>
                              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                {new Date(sub.submittedAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {sub.message && (
                        <div style={{ 
                          padding: '16px 20px', 
                          background: '#f8fafc', 
                          borderRadius: '16px', 
                          fontSize: '15px', 
                          lineHeight: '1.6', 
                          color: '#334155',
                          borderLeft: '4px solid var(--primary-blue)',
                          marginBottom: '20px'
                        }}>
                          {sub.message}
                        </div>
                      )}

                      {sub.files && sub.files.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                           {sub.files.map((file, fIdx) => (
                             <a key={fIdx} href={file.data} download={file.name} style={{ 
                               background: '#ffffff', 
                               padding: '12px 16px', 
                               borderRadius: '16px',
                               border: '1.5px solid #edf2f7', 
                               display: 'flex', 
                               alignItems: 'center',
                               gap: '12px', 
                               fontSize: '13px',
                               width: 'fit-content',
                               minWidth: '220px',
                               transition: 'all 0.2s ease',
                               cursor: 'pointer',
                               textDecoration: 'none'
                             }}
                             onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-blue)'; e.currentTarget.style.background = '#f0f9ff'; }}
                             onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#edf2f7'; e.currentTarget.style.background = '#ffffff'; }}
                             >
                               <div style={{ 
                                 width: '36px', 
                                 height: '36px', 
                                 background: '#f1f5f9', 
                                 borderRadius: '10px', 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 justifyContent: 'center'
                               }}>
                                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-blue)' }}>
                                   <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                   <polyline points="13 2 13 9 20 9"></polyline>
                                 </svg>
                               </div>
                               <div style={{ flex: 1 }}>
                                 <span style={{ 
                                   display: 'block', 
                                   maxWidth: '160px', 
                                   overflow: 'hidden', 
                                   textOverflow: 'ellipsis', 
                                   whiteSpace: 'nowrap', 
                                   fontWeight: '700', 
                                   color: '#1e293b',
                                   marginBottom: '2px'
                                 }}>{file.name}</span>
                                 <span style={{ 
                                   color: 'var(--primary-blue)', 
                                   fontWeight: '800', 
                                   fontSize: '11px',
                                   textTransform: 'uppercase',
                                   letterSpacing: '0.5px'
                                 }}>Download Attachment</span>
                               </div>
                             </a>
                           ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '80px 20px', background: '#f8fafc', borderRadius: '32px', border: '2px dashed #e2e8f0' }}>
                  <div style={{ 
                    width: '72px', 
                    height: '72px', 
                    background: 'white', 
                    borderRadius: '24px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 20px auto', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#cbd5e1' }}>
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '20px', fontWeight: '800' }}>No Submissions Yet</h4>
                  <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '300px', margin: '0 auto', lineHeight: '1.5' }}>
                    When students upload files to this post, their work will appear here instantly.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal for viewing student list */}
      {studentsModal.isOpen && (
        <div className="std-modal-overlay" onClick={() => setStudentsModal({ ...studentsModal, isOpen: false })}>
          <div className="std-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="std-modal-header">
              <div>
                <h3>Enrolled Students</h3>
                <p className="std-modal-subtitle">{studentsModal.roomName}</p>
              </div>
              <button 
                className="std-close-btn"
                onClick={() => setStudentsModal({ ...studentsModal, isOpen: false })}
              >
                <Icons.Close />
              </button>
            </div>
            <div className="std-modal-body">
              {studentsModal.students.length > 0 ? (
                <div className="std-table-wrapper">
                  <table className="std-list-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Roll no</th>
                        <th>Email Address</th>
                        <th>Joined On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsModal.students.map((student, index) => (
                        <tr key={index}>
                          <td>
                            <div className="std-name-cell">
                              <div className="std-avatar">
                                {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                              </div>
                              <span style={{ fontWeight: '600' }}>{student.name}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: '700', color: '#1089D3' }}>{student.studentId || 'N/A'}</td>
                          <td style={{ color: '#64748b' }}>{student.email}</td>
                          <td style={{ fontSize: '0.85rem' }}>{new Date(student.joinedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                </div>
              ) : (
                <div className="std-empty-state">
                  <div className="std-empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <p>No students have joined this classroom yet.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      <NotificationModal

        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        buttonText={notification.buttonText}
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

export default TeacherClassroom;
