import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminPage.css';
import { adminAPI, examAPI, postAPI } from '../../utils/api';
import { showToast } from '../../utils/CustomToast';
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal';
import InputModal from '../../components/ConfirmationModal/InputModal';

import { socket } from '../../utils/socket';

const AdminPage = () => {
  // State
  const [activeView, setActiveView] = useState('teachers');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modals, setModals] = useState({
    teacherModal: false,
    studentModal: false,
    bannedTeacherModal: false,
    bannedStudentModal: false,
    teacherProfileModal: false,
    studentProfileModal: false,
    studentRequestModal: false,
    approvalInputModal: false,
    rejectionInputModal: false,
    classroomContentModal: false,
    postModal: false,
    classroomExamsModal: false,
    examSubmissionsModal: false,
    studentExamsModal: false,
    adminAnalyticsModal: false,
    viewingSubmissions: false,
    teacherMaterialsModal: false,
  });
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [allowStudentUpload, setAllowStudentUpload] = useState(false);
  const [classroomExams, setClassroomExams] = useState([]);
  const [examSubmissions, setExamSubmissions] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedExamDetails, setSelectedExamDetails] = useState(null);
  const [studentCompletedExams, setStudentCompletedExams] = useState([]);
  const [examLoading, setExamLoading] = useState(false);
  const [classroomPosts, setClassroomPosts] = useState([]);
  const [globalPosts, setGlobalPosts] = useState([]);
  const [globalExams, setGlobalExams] = useState([]);
  const [globalPostsLoading, setGlobalPostsLoading] = useState(false);
  const [globalExamsLoading, setGlobalExamsLoading] = useState(false);
  const [currentClassroom, setCurrentClassroom] = useState(null);
  const [currentPost, setCurrentPost] = useState(null);
  const [postLoading, setPostLoading] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [confirm, setConfirm] = useState({ visible: false, title: '', message: '', onConfirm: null });
  const [teacherSearch, setTeacherSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [postSearch, setPostSearch] = useState('');
  const [globalPostSearch, setGlobalPostSearch] = useState('');
  const [globalExamSearch, setGlobalExamSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Real Data from Backend
  const [stats, setStats] = useState({ totalTeachers: 0, activeTeachers: 0, pendingRequests: 0, bannedTeachers: 0 });
  const [teachers, setTeachers] = useState([]);
  const [teacherRequests, setTeacherRequests] = useState([]);
  const [bannedTeachers, setBannedTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Student data
  const [students, setStudents] = useState([]);
  const [studentRequests, setStudentRequests] = useState([]);
  const [studentStats, setStudentStats] = useState({ totalStudents: 0, activeStudents: 0, pendingRequests: 0, bannedStudents: 0 });
  const [bannedStudents, setBannedStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Classroom students viewer
  const [classroomStudentsData, setClassroomStudentsData] = useState(null); // { classroom, students }
  const [classroomStudentsLoading, setClassroomStudentsLoading] = useState(false);

  // Admin Data
  const navigate = useNavigate();
  const [admin, setAdmin] = useState({ name: 'Super Admin', email: 'admin@nexted.ai' });

  useEffect(() => {
    const data = localStorage.getItem('admin_data');
    if (data) {
      setAdmin(JSON.parse(data));
    }
  }, []);

  const fetchAllTeacherData = async () => {
    await Promise.all([
      fetchStats(),
      fetchTeachers(),
      fetchTeacherRequests(),
      fetchBannedTeachers(),
      fetchStudents(),
      fetchStudentStats(),
      fetchStudentRequests(),
      fetchBannedStudents()
    ]);
  };

  // Socket listener for new teacher requests
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const handleNewRequest = (data) => {
      showToast('New teacher registration request received!');
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingRequests: prev.pendingRequests + 1,
        totalTeachers: prev.totalTeachers + 1
      }));

      // Update requests list
      setTeacherRequests(prev => {
        // checks if already exists
        if (prev.find(r => r.email === data.data.email)) return prev;
        
        const newRequest = {
          ...data.data,
          id: data.data._id,
          initials: `${data.data.name?.charAt(0) || ''}${data.data.surname?.charAt(0) || ''}`,
          dept: data.data.department
        };
        return [newRequest, ...prev];
      });
    };

    socket.on('admin-new-teacher-request', handleNewRequest);

    return () => {
      socket.off('admin-new-teacher-request', handleNewRequest);
    };
  }, []);

  // Socket listener for new student requests
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const handleNewStudent = (data) => {
      showToast('New student registration request received!');
      
      // Update stats
      setStudentStats(prev => ({
        ...prev,
        pendingRequests: prev.pendingRequests + 1,
        totalStudents: prev.totalStudents + 1
      }));

      // Update student requests list
      setStudentRequests(prev => {
        if (prev.find(s => s.email === data.data.email)) return prev;
        const newRequest = {
          ...data.data,
          id: data.data._id,
          initials: `${data.data.name?.charAt(0) || 'S'}`,
          role: 'student'
        };
        return [newRequest, ...prev];
      });
    };

    socket.on('admin-new-student-request', handleNewStudent);

    return () => {
      socket.off('admin-new-student-request', handleNewStudent);
    };
  }, []);

  // Fetch all teacher data on mount
  useEffect(() => {
    fetchAllTeacherData();
  }, []);

  const fetchGlobalPosts = async () => {
    setGlobalPostsLoading(true);
    const result = await adminAPI.getAllGlobalPosts();
    if (result.success) {
      setGlobalPosts(result.data?.data || []);
    } else {
      showToast('Failed to load global posts', 'error');
    }
    setGlobalPostsLoading(false);
  };

  const fetchGlobalExams = async () => {
    setGlobalExamsLoading(true);
    const result = await adminAPI.getAllGlobalExams();
    if (result.success) {
      setGlobalExams(result.data?.data || []);
    } else {
      showToast('Failed to load global exams', 'error');
    }
    setGlobalExamsLoading(false);
  };

  // Fetch global data on view switch - always reload fresh data
  useEffect(() => {
    if (activeView === 'general-posts') {
      fetchGlobalPosts();
    } else if (activeView === 'general-exams') {
      fetchGlobalExams();
    }
  }, [activeView]);

  // New Exam-related functions
  const viewClassroomExams = async (classroom) => {
    setCurrentClassroom(classroom);
    setClassroomExams([]);
    openModal('classroomExamsModal');
    const result = await examAPI.getClassroomExams(classroom._id);
    if (result.success) {
      setClassroomExams(result.data.exams);
    } else {
      showToast(result.message || 'Failed to fetch exams', 'error');
    }
  };

  const viewExamSubmissions = async (exam) => {
    setSelectedExam(exam);
    setExamSubmissions([]);
    openModal('examSubmissionsModal');
    const result = await examAPI.getExamSubmissions(exam._id);
    if (result.success) {
      setExamSubmissions(result.data.submissions);
    } else {
      showToast(result.message || 'Failed to fetch submissions', 'error');
    }
  };

  const viewAdminAnalytics = async (submission) => {
    setSelectedSubmission(submission);
    setSelectedExamDetails(null); // Reset
    openModal('adminAnalyticsModal');
    
    // Fix: extract ID if populated as object, or use as string
    const examId = submission.examId?._id || submission.examId;
    
    if (!examId || examId === '[object Object]') {
      showToast('Invalid Exam ID', 'error');
      return;
    }

    const result = await examAPI.getExam(examId);
    if (result.success) {
      setSelectedExamDetails(result.data.exam);
    } else {
      showToast('Failed to load full exam details', 'error');
    }
  };

  const viewStudentExams = async (student) => {
    setCurrentStudent(student);
    setStudentCompletedExams([]);
    openModal('studentExamsModal');
    const result = await examAPI.getStudentSubmissions(student.email);
    if (result.success) {
      setStudentCompletedExams(result.data.submissions);
    } else {
      showToast(result.message || 'Failed to fetch student exams', 'error');
    }
  };

  const viewSubmissions = async (post) => {
    setCurrentPost(post);
    setSubmissions([]);
    setSubmissionsLoading(true);
    openModal('viewingSubmissions');
    try {
      const result = await postAPI.getPostSubmissions(post._id);
      if (result && result.success) {
        setSubmissions(result.data.submissions || []);
      } else {
        showToast(result?.message || 'Failed to fetch submissions', 'error');
      }
    } catch (error) {
      console.error('Error in viewSubmissions:', error);
      showToast('An error occurred while fetching submissions', 'error');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const viewTeacherMaterials = (post) => {
    setCurrentPost(post);
    openModal('teacherMaterialsModal');
  };

  const fetchStats = async () => {
    const result = await adminAPI.getTeacherStats();
    if (result.success) {
      setStats(result.data.data);
    }
  };

  const fetchTeachers = async () => {
    const result = await adminAPI.getAllTeachers();
    if (result.success) {
      setTeachers(result.data.data.map(t => ({
        ...t,
        id: t._id,
        initials: `${t.name?.charAt(0) || ''}${t.surname?.charAt(0) || ''}`,
        dept: t.department
      })));
    }
  };

  const fetchTeacherRequests = async () => {
    const result = await adminAPI.getTeacherRequests();
    if (result.success) {
      setTeacherRequests(result.data.data.map(t => ({
        ...t,
        id: t._id,
        initials: `${t.name?.charAt(0) || ''}${t.surname?.charAt(0) || ''}`,
        dept: t.department
      })));
    }
  };

  const fetchBannedTeachers = async () => {
    const result = await adminAPI.getBannedTeachers();
    if (result.success) {
      setBannedTeachers(result.data.data.map(t => ({
        ...t,
        id: t._id,
        initials: `${t.name?.charAt(0) || ''}${t.surname?.charAt(0) || ''}`,
        dept: t.department
      })));
    }
  };

  const fetchStudents = async () => {
    const result = await adminAPI.getAllStudents();
    if (result.success) {
      setStudents(result.data.data.map(s => ({
        ...s,
        id: s._id,
        initials: `${s.name?.charAt(0) || 'S'}`,
        role: 'student'
      })));
    }
  };

  const fetchStudentStats = async () => {
    const result = await adminAPI.getStudentStats();
    if (result.success) {
      setStudentStats(result.data.data);
    }
  };

  const fetchStudentRequests = async () => {
    const result = await adminAPI.getStudentRequests();
    if (result.success) {
      setStudentRequests(result.data.data.map(s => ({
        ...s,
        id: s._id,
        initials: `${s.name?.charAt(0) || 'S'}`,
        role: 'student'
      })));
    }
  };

  const fetchBannedStudents = async () => {
    const result = await adminAPI.getBannedStudents();
    if (result.success) {
      setBannedStudents(result.data.data.map(s => ({
        ...s,
        id: s._id,
        initials: `${s.name?.charAt(0) || 'S'}`,
        role: 'student'
      })));
    }
  };

  const handleLogout = () => {
    showConfirm('Logout?', 'Are you sure you want to logout?', () => {
      localStorage.removeItem('admin_token');
      navigate('/admin/login');
    }, { isDanger: true, confirmText: 'Yes, Logout' });
  };

  // Refs for touch swipe
  const touchStartX = useRef(0);

  // Derived counts from real data
  const totalTeachers = stats.totalTeachers;
  const activeTeachers = stats.activeTeachers;
  const pendingTeachers = stats.pendingRequests;
  const bannedTeachersCount = stats.bannedTeachers;

  const totalStudents = studentStats.totalStudents;
  const activeStudents = studentStats.activeStudents;
  const pendingStudents = studentStats.pendingRequests || 0;
  const bannedStudentsCount = studentStats.bannedStudents;

  // Handlers
  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const openModal = (modalId) => {
    setModals(prev => ({ ...prev, [modalId]: true }));
    document.body.style.overflow = 'hidden';
  };

  const closeModal = (modalId) => {
    setModals(prev => ({ ...prev, [modalId]: false }));
    document.body.style.overflow = '';
  };

  const showConfirm = (title, message, onConfirm, options = {}) => {
    setConfirm({ visible: true, title, message, onConfirm, options });
  };

  const hideConfirm = () => {
    setConfirm({ visible: false, title: '', message: '', onConfirm: null });
  };


  // Teacher Actions
  const handleApproveClick = (teacherId, teacherName) => {
    setCurrentTeacher({ id: teacherId, name: teacherName });
    openModal('approvalInputModal');
  };

  const handleApproveSubmit = async (message) => {
    closeModal('approvalInputModal');
    const finalMessage = message.trim() || 'Your account has been approved. Welcome to NextEd AI!';
    const result = await adminAPI.approveTeacher(currentTeacher.id, finalMessage);
    if (result.success) {
      showToast('Teacher approved successfully!', "success");
      await fetchAllTeacherData();
    } else {
      showToast('Failed to approve teacher', "error");
    }
    setCurrentTeacher(null);
  };

  const handleRejectClick = (teacherId, teacherName) => {
    setCurrentTeacher({ id: teacherId, name: teacherName });
    openModal('rejectionInputModal');
  };

  const handleRejectSubmit = async (reason) => {
    closeModal('rejectionInputModal');
    if (!reason.trim()) {
      showToast('Rejection reason is required', "error");
      return;
    }
    const result = await adminAPI.rejectTeacher(currentTeacher.id, reason);
    if (result.success) {
      showToast('Teacher rejected', "delete");
      await fetchAllTeacherData();
    } else {
      showToast('Failed to reject teacher', "error");
    }
    setCurrentTeacher(null);
  };

  const handleDelete = async (teacherId, teacherName) => {
    showConfirm(`Delete ${teacherName}?`, 'This will DELETE all classrooms created by this teacher!', async () => {
      const result = await adminAPI.deleteTeacher(teacherId);
      if (result.success) {
        showToast(`${teacherName} has been deleted`, "delete");
        await fetchAllTeacherData();
      } else {
        showToast('Failed to delete teacher', "error");
      }
    }, { isDanger: true, confirmText: "Yes, Delete" });
  };

  const handleBan = async (teacherId, teacherName) => {
    showConfirm(`Ban ${teacherName}?`, `${teacherName} will lose platform access.`, async () => {
      const result = await adminAPI.banTeacher(teacherId);
      if (result.success) {
        showToast(`${teacherName} has been banned`, "ban");
        await fetchAllTeacherData();
      } else {
        showToast('Failed to ban teacher', "error");
      }
    }, { isDanger: true, confirmText: "Yes, Ban" });
  };

  const handleUnban = async (teacherId, teacherName) => {
    showConfirm(`Unban ${teacherName}?`, `${teacherName} will regain platform access.`, async () => {
      const result = await adminAPI.unbanTeacher(teacherId);
      if (result.success) {
        showToast(`${teacherName} has been unbanned`, "success");
        await fetchAllTeacherData();
      } else {
        showToast('Failed to unban teacher', "error");
      }
    }, { isDanger: false, confirmText: "Yes, Unban" });
  };

  // Student Approve/Reject Actions
  const handleStudentApproveClick = (studentId, studentName) => {
    setCurrentStudent({ id: studentId, name: studentName });
    openModal('approvalInputModal');
  };

  const handleStudentRejectClick = (studentId, studentName) => {
    setCurrentStudent({ id: studentId, name: studentName });
    openModal('rejectionInputModal');
  };

  const handleStudentApproveSubmit = async (approvalMessage) => {
    if (!currentStudent) return;

    const result = await adminAPI.approveStudent(currentStudent.id, approvalMessage);
    
    if (result.success) {
      showToast(`✅ ${currentStudent.name} approved successfully!`, "success");
      
      // Update student requests
      setStudentRequests(prev => prev.filter(s => s.id !== currentStudent.id));
      
      // Update stats
      setStudentStats(prev => ({
        ...prev,
        pendingRequests: prev.pendingRequests - 1,
        activeStudents: prev.activeStudents + 1
      }));

      // Fetch fresh data
      await fetchStudents();
      
      closeModal('approvalInputModal');
      setCurrentStudent(null);
    } else {
      showToast('❌ Failed to approve student', "error");
    }
  };

  const handleStudentRejectSubmit = async (rejectedReason) => {
    if (!currentStudent) return;

    const result = await adminAPI.rejectStudent(currentStudent.id, rejectedReason);
    
    if (result.success) {
      showToast(`❌ ${currentStudent.name} rejected`, "delete");
      
      // Remove from requests
      setStudentRequests(prev => prev.filter(s => s.id !== currentStudent.id));
      
      // Update stats
      setStudentStats(prev => ({
        ...prev,
        pendingRequests: prev.pendingRequests - 1,
        totalStudents: prev.totalStudents - 1
      }));
      
      closeModal('rejectionInputModal');
      setCurrentStudent(null);
    } else {
      showToast('❌ Failed to reject student', "error");
    }
  };

  // Student Actions
  const handleStudentDelete = async (studentId, studentName) => {
    showConfirm(`Delete ${studentName}?`, 'This will permanently remove the student account.', async () => {
      const result = await adminAPI.deleteStudent(studentId);
      if (result.success) {
        showToast(`${studentName} deleted`, "delete");
        await fetchStudents();
        await fetchBannedStudents();
        await fetchStudentStats();
      } else {
        showToast('Failed to delete student', "error");
      }
    }, { isDanger: true, confirmText: "Yes, Delete" });
  };

  const handleStudentBan = async (studentId, studentName) => {
    showConfirm(`Ban ${studentName}?`, 'Student will be logged out instantly.', async () => {
      const result = await adminAPI.banStudent(studentId);
      if (result.success) {
        showToast(`${studentName} banned`, "ban");
        await fetchStudents();
        await fetchBannedStudents();
        await fetchStudentStats();
      } else {
        showToast('Failed to ban student', "error");
      }
    }, { isDanger: true, confirmText: "Yes, Ban" });
  };

  const handleStudentUnban = async (studentId, studentName) => {
    showConfirm(`Unban ${studentName}?`, 'Student will regain access.', async () => {
      const result = await adminAPI.unbanStudent(studentId);
      if (result.success) {
        showToast(`${studentName} unbanned`, "success");
        await fetchStudents();
        await fetchBannedStudents();
        await fetchStudentStats();
      } else {
        showToast('Failed to unban student', "error");
      }
    }, { isDanger: false, confirmText: "Yes, Unban" });
  };

  const viewStudentProfile = async (studentId) => {
    const result = await adminAPI.getStudentProfile(studentId);
    if (result.success) {
      setSelectedStudent(result.data.data);
      openModal('studentProfileModal');
    } else {
      showToast('Failed to load student profile', "error");
    }
  };

  const viewTeacherProfile = async (teacherId) => {
    const result = await adminAPI.getTeacherProfile(teacherId);
    if (result.success) {
      setSelectedTeacher(result.data.data);
      openModal('teacherProfileModal');
    } else {
      showToast('Failed to load teacher profile', "error");
    }
  };

  const viewClassroomStudents = async (classroom) => {
    setClassroomStudentsLoading(true);
    setClassroomStudentsData({ classroom, students: [] });
    const result = await adminAPI.getClassroomStudents(classroom._id);
    if (result.success) {
      setClassroomStudentsData(result.data.data);
    } else {
      showToast('Failed to load student list', 'error');
      setClassroomStudentsData(null);
    }
    setClassroomStudentsLoading(false);
  };

  // Classroom & Post Management Handlers
  const handleAdminDeleteClassroom = async (classroomId, classroomName) => {
    showConfirm(`Delete Classroom?`, `This will permanently delete "${classroomName}" and all its posts!`, async () => {
      const result = await adminAPI.deleteClassroom(classroomId);
      if (result.success) {
        showToast('Classroom deleted successfully', 'error');
        // Refresh teacher profile to show updated list
        if (selectedTeacher) {
          viewTeacherProfile(selectedTeacher.teacher._id);
        }
      } else {
        showToast('Failed to delete classroom', 'error');
      }
    }, { isDanger: true, confirmText: 'Yes, Delete' });
  };

  const openClassroomContent = async (classroom) => {
    setCurrentClassroom(classroom);
    setPostLoading(true);
    openModal('classroomContentModal');
    
    const result = await adminAPI.getClassroomPosts(classroom._id);
    if (result.success) {
      setClassroomPosts(result.data.data || []);
    } else {
      showToast('Failed to load classroom posts', 'error');
    }
    setPostLoading(false);
  };

  const handleAdminDeletePost = async (postId) => {
    showConfirm('Delete Post?', 'Are you sure you want to delete this post?', async () => {
      const result = await adminAPI.adminDeletePost(postId, admin.email);
      if (result.success) {
        showToast('Post deleted', 'error');
        // Refresh posts
        const updatedPosts = await adminAPI.getClassroomPosts(currentClassroom._id);
        if (updatedPosts.success) setClassroomPosts(updatedPosts.data.data);
      } else {
        showToast('Failed to delete post', 'error');
      }
    }, { isDanger: true });
  };

  const handleAdminSavePost = async (postData) => {
    let result;
    if (currentPost) {
      result = await adminAPI.adminUpdatePost(currentPost._id, {
        ...postData,
        allowStudentUpload
      });
    } else {
      result = await adminAPI.adminCreatePost(currentClassroom._id, {
        ...postData,
        allowStudentUpload,
        teacherName: `Admin (${admin.name})`
      });
    }

    if (result.success) {
      showToast(currentPost ? 'Post updated' : 'Post created', 'success');
      closeModal('postModal');
      setAllowStudentUpload(false);
      // Refresh posts
      const updatedPosts = await adminAPI.getClassroomPosts(currentClassroom._id);
      if (updatedPosts.success) setClassroomPosts(updatedPosts.data.data);
    } else {
      showToast('Failed to save post', 'error');
    }
  };

  const openPostModal = (post = null) => {
    setCurrentPost(post);
    setAllowStudentUpload(post ? !!post.allowStudentUpload : false);
    openModal('postModal');
  };

  // Filtered lists
  const filteredTeachers = teachers.filter(t =>
    (t.name || '').toLowerCase().includes(teacherSearch.toLowerCase()) ||
    t.email.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    (t.dept || '').toLowerCase().includes(teacherSearch.toLowerCase())
  );

  const filteredStudents = students.filter(s =>
    (s.name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.courseDepartment || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.year || '').toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredPosts = classroomPosts.filter(post =>
    (post.title || '').toLowerCase().includes(postSearch.toLowerCase()) ||
    (post.description || '').toLowerCase().includes(postSearch.toLowerCase())
  );

  const filteredGlobalPosts = globalPosts.filter(post =>
    (post.title || '').toLowerCase().includes(globalPostSearch.toLowerCase()) ||
    (post.description || '').toLowerCase().includes(globalPostSearch.toLowerCase()) ||
    (post.teacherName || '').toLowerCase().includes(globalPostSearch.toLowerCase()) ||
    (post.classroomId?.subject || '').toLowerCase().includes(globalPostSearch.toLowerCase())
  );

  const filteredGlobalExams = globalExams.filter(exam =>
    (exam.examName || '').toLowerCase().includes(globalExamSearch.toLowerCase()) ||
    (exam.subject || '').toLowerCase().includes(globalExamSearch.toLowerCase()) ||
    (exam.classroomId?.subject || '').toLowerCase().includes(globalExamSearch.toLowerCase()) ||
    (exam.teacherName || '').toLowerCase().includes(globalExamSearch.toLowerCase())
  );

  // Touch swipe for sidebar
  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartX.current = e.changedTouches[0].screenX;
    };
    const handleTouchEnd = (e) => {
      const diff = e.changedTouches[0].screenX - touchStartX.current;
      if (diff > 80 && touchStartX.current < 40 && window.innerWidth <= 900) {
        setSidebarOpen(true);
      }
      if (diff < -80 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [sidebarOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (confirm.visible) {
          hideConfirm();
          return;
        }
        const anyModalOpen = Object.values(modals).some(v => v);
        if (anyModalOpen) {
          setModals({
            teacherModal: false,
            studentModal: false,
            bannedTeacherModal: false,
            bannedStudentModal: false,
            teacherProfileModal: false,
            studentProfileModal: false,
            studentRequestModal: false,
            approvalInputModal: false,
            rejectionInputModal: false,
          });
          document.body.style.overflow = '';
        }
        if (sidebarOpen) closeSidebar();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [confirm.visible, modals, sidebarOpen]);

  return (
    <>
      <button
        className={`hamburger ${sidebarOpen ? 'active' : ''}`}
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <span></span><span></span><span></span>
      </button>
      <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={closeSidebar}></div>

      <div className="dashboard-wrapper">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="brand">
            <div className="brand-icon">
              <svg viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>
            </div>
            <h1 className="gradient-text">NextEd AI</h1>
            <p className="brand-subtitle">Super Admin Panel</p>
          </div>
          <p className="nav-section-label">Management</p>
          <div className="nav-buttons">
            <button
              className={`nav-btn soft-green ${activeView === 'teachers' ? 'active' : ''}`}
              onClick={() => { setActiveView('teachers'); closeSidebar(); }}
            >
              <svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>
              Manage Teachers
            </button>
            <button
              className={`nav-btn soft-blue ${activeView === 'students' ? 'active' : ''}`}
              onClick={() => { setActiveView('students'); closeSidebar(); }}
            >
              <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
              Manage Students
            </button>
            <button
              className={`nav-btn soft-indigo ${activeView === 'general-posts' ? 'active' : ''}`}
              onClick={() => { setActiveView('general-posts'); closeSidebar(); }}
            >
              <svg viewBox="0 0 24 24"><path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/></svg>
              General Posts
            </button>
            <button
              className={`nav-btn soft-cyan ${activeView === 'general-exams' ? 'active' : ''}`}
              onClick={() => { setActiveView('general-exams'); closeSidebar(); }}
            >
              <svg viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
              General Exams
            </button>
          </div>
          <div className="sidebar-footer">
            <div className="admin-info">
              <div className="admin-avatar">{admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}</div>
              <div className="admin-details">
                <h4 style={{fontSize: '14px', marginBottom: '2px'}}>{admin.name}</h4>
                <span style={{fontSize: '11px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px'}} title={admin.email}>{admin.email}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
            <button onClick={() => {
                showConfirm('Delete Account?', 'This will permanently delete your admin account.', async () => {
                    try {
                        const response = await axios.delete(`/api/admin/delete-account/${admin.email}`);
                        if (response.status === 200) {
                             localStorage.removeItem('admin_data');
                             localStorage.removeItem('admin_token');
                             navigate('/admin/signup');
                        }
                    } catch (err) {
                        console.error("Error deleting account:", err);
                        showToast("Failed to delete account", 'error');
                    }
                }, { isDanger: true, confirmText: "Yes, Delete" });
            }} className="delete-account-btn">
              Delete Account
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Teachers View */}
          <div className={`page-view ${activeView === 'teachers' ? 'active' : ''}`} id="teachersView">
            <div className="content-header">
              <div>
                <h2>Manage Teachers</h2>
                <p className="content-header-sub">View and manage all registered teachers</p>
              </div>
              <button className="btn-view-requests" onClick={() => openModal('teacherModal')}>
                <svg viewBox="0 0 24 24" fill="white"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                View Requests
                {pendingTeachers > 0 && (
                  <span className="request-count-badge">{pendingTeachers}</span>
                )}
              </button>
            </div>
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-card-icon"><svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg></div>
                <h3>{totalTeachers}</h3><p>Total Teachers</p>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>
                <h3>{activeTeachers}</h3><p>Active</p>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></div>
                <h3>{pendingTeachers}</h3><p>Pending Requests</p>
              </div>
              <div className="stat-card clickable" onClick={() => openModal('bannedTeacherModal')}>
                <div className="stat-card-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/></svg></div>
                <h3>{bannedTeachersCount}</h3><p>Banned</p><div className="click-hint">👆 Tap to manage</div>
              </div>
            </div>

            <div className="table-card">
              <div className="table-card-header">
                <h3>All Teachers</h3>
                <div className="table-search">
                  <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                  <input
                    type="text"
                    placeholder="Search teachers..."
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Teacher Full Name</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody id="teacherTableBody">
                    {filteredTeachers.map(teacher => (
                      <tr key={teacher.id} data-name={teacher.name}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">{teacher.initials}</div>
                            <div>
                              <div className="user-name">{teacher.name}</div>
                              <div className="user-email">{teacher.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="department-badge">{teacher.dept}</span></td>
                        <td>
                          <span className={`status-badge ${teacher.isBanned ? 'banned' : 'active'}`}>
                            {teacher.isBanned ? 'Banned' : 'Active'}
                          </span>
                        </td>
                        <td>
                          <div className="actions-cell" style={{ gap: '6px' }}>
                            <button className="btn-soft-resource btn-soft-blue" onClick={() => viewTeacherProfile(teacher.id)} style={{ minWidth: '40px', padding: '10px' }}>
                              <span className="tooltip">View Profile</span>
                              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25S13.24 11.25 12 11.25 9.75 10.24 9.75 9s1.01-2.25 2.25-2.25zM17 17H7v-.75c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z"/></svg>
                            </button>
                            <button className="btn-soft-resource btn-soft-red" onClick={() => handleDelete(teacher.id, teacher.name)} style={{ minWidth: '40px', padding: '10px' }}>
                              <span className="tooltip">Delete</span>
                              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                            </button>
                            <button className="btn-soft-resource btn-soft-blue" onClick={() => handleBan(teacher.id, teacher.name)} style={{ minWidth: '40px', padding: '10px' }}>
                              <span className="tooltip">Ban</span>
                              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              </div>
              
              {/* Mobile Cards (Teachers) */}
              <div className="mobile-cards">
                {filteredTeachers.map(teacher => (
                  <div key={teacher.id} className="mobile-card">
                    <div className="mobile-card-header">
                      <div className="user-cell">
                        <div className="user-avatar">{teacher.initials}</div>
                        <div>
                          <div className="user-name">{teacher.name} {teacher.surname}</div>
                          <div className="user-email">{teacher.email}</div>
                        </div>
                      </div>
                      <div className="action-btn" onClick={(e) => { e.stopPropagation(); viewTeacherProfile(teacher.id); }} style={{background: 'rgba(16,137,211,0.1)', width: '32px', height: '32px'}}>
                        <svg viewBox="0 0 24 24" style={{width: '18px', height: '18px'}}><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25S13.24 11.25 12 11.25 9.75 10.24 9.75 9s1.01-2.25 2.25-2.25zM17 17H7v-.75c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z"/></svg>
                      </div>
                    </div>
                    <div className="mobile-card-info">
                      <div className="mobile-card-info-item">
                        <span className="mobile-card-info-label">Department</span>
                        <span className="department-badge" style={{alignSelf: 'flex-start'}}>{teacher.dept}</span>
                      </div>
                      <div className="mobile-card-info-item">
                        <span className="mobile-card-info-label">Status</span>
                        <span className={`status-badge ${teacher.isBanned ? 'banned' : 'active'}`} style={{fontSize: '11px', padding: '2px 8px'}}>
                            {teacher.isBanned ? 'Banned' : 'Active'}
                        </span>
                      </div>
                    </div>
                    <div className="mobile-card-actions" style={{ paddingTop: '12px', gap: '8px' }}>
                      <button className="btn-soft-resource btn-soft-blue" onClick={() => viewTeacherProfile(teacher.id)} style={{ flex: 1, minWidth: 'auto', fontSize: '12px' }}>
                        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25S13.24 11.25 12 11.25 9.75 10.24 9.75 9s1.01-2.25 2.25-2.25zM17 17H7v-.75c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z"/></svg>
                        Profile
                      </button>
                      <button className="btn-soft-resource btn-soft-blue" onClick={() => handleBan(teacher.id, teacher.name)} style={{ flex: 1, minWidth: 'auto', fontSize: '12px' }}>
                        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                        Ban
                      </button>
                      <button className="btn-soft-resource btn-soft-red" onClick={() => handleDelete(teacher.id, teacher.name)} style={{ flex: 1, minWidth: 'auto', fontSize: '12px' }}>
                        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`no-results ${filteredTeachers.length === 0 && teacherSearch ? 'show' : ''}`} id="teacherNoResults">
               <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                <p>No teachers found</p>
              </div>
            </div>
          </div>

          {/* Students View */}
          <div className={`page-view ${activeView === 'students' ? 'active' : ''}`} id="studentsView">
            <div className="content-header">
              <div>
                <h2>Manage Students</h2>
                <p className="content-header-sub">View and manage all registered students</p>
              </div>
              <button className="btn-view-requests" onClick={() => openModal('studentRequestModal')}>
                <svg viewBox="0 0 24 24" fill="white"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                View Requests
                {pendingStudents > 0 && (
                  <span className="request-count-badge">{pendingStudents}</span>
                )}
              </button>
            </div>

            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-card-icon"><svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg></div>
                <h3>{studentStats.totalStudents}</h3><p>Total Students</p>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>
                <h3>{studentStats.activeStudents}</h3><p>Active</p>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></div>
                <h3>{pendingStudents}</h3><p>Pending Requests</p>
              </div>
              <div className="stat-card clickable" onClick={() => openModal('bannedStudentModal')}>
                <div className="stat-card-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/></svg></div>
                <h3>{studentStats.bannedStudents}</h3><p>Banned</p><div className="click-hint">👆 Tap to manage</div>
              </div>
            </div>
            
            <div className="table-card">
              <div className="table-card-header">
                <h3>All Students</h3>
                <div className="table-search">
                  <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Student Info</th><th>Department / Year</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredStudents.map(student => (
                      <tr key={student.id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">{student.initials}</div>
                            <div>
                              <div className="user-name">{student.name}</div>
                              <div className="user-email">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>{student.courseDepartment}</div>
                          <div style={{fontSize: '11px', color: 'var(--muted-text)'}}>Year: {student.year}</div>
                        </td>
                        <td>
                          <span className={`status-badge ${student.isBanned ? 'banned' : 'active'}`}>
                            {student.isBanned ? 'Banned' : 'Active'}
                          </span>
                        </td>
                        <td>
                          <div className="actions-cell" style={{ gap: '6px' }}>
                            <button className="btn-soft-resource btn-soft-blue" onClick={() => viewStudentProfile(student.id)} style={{ minWidth: '40px', padding: '10px' }}>
                              <span className="tooltip">View Profile</span>
                              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25S13.24 11.25 12 11.25 9.75 10.24 9.75 9s1.01-2.25 2.25-2.25zM17 17H7v-.75c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z"/></svg>
                            </button>
                            <button className="btn-soft-resource btn-soft-red" onClick={() => handleStudentDelete(student.id, student.name)} style={{ minWidth: '40px', padding: '10px' }}>
                              <span className="tooltip">Delete</span>
                              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                            </button>
                            {student.isBanned ? (
                              <button className="btn-soft-resource btn-soft-blue" onClick={() => handleStudentUnban(student.id, student.name)} style={{ minWidth: '40px', padding: '10px' }}>
                                <span className="tooltip">Unban</span>
                                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5-1.5 0-2.84.63-3.82 1.64L9.59 4.05C10.27 3.39 11.09 3 12 3c1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM3.27 2.27L2 3.54l2.71 2.71A2 2 0 0 0 4 7.69V18c0 1.1.9 2 2 2h12c.34 0 .65-.09.94-.21L20.46 22l1.27-1.27L3.27 2.27z"/></svg>
                              </button>
                            ) : (
                              <button className="btn-soft-resource btn-soft-blue" onClick={() => handleStudentBan(student.id, student.name)} style={{ minWidth: '40px', padding: '10px' }}>
                                <span className="tooltip">Ban</span>
                                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards (Students) */}
              <div className="mobile-cards">
                {filteredStudents.map(student => (
                  <div key={student.id} className="mobile-card">
                    <div className="mobile-card-header">
                      <div className="user-cell">
                        <div className="user-avatar student">{student.initials}</div>
                        <div>
                          <div className="user-name">{student.name} {student.surname}</div>
                          <div className="user-email">{student.email}</div>
                        </div>
                      </div>
                      <div className="action-btn" onClick={(e) => { e.stopPropagation(); viewStudentProfile(student.id); }} style={{background: 'rgba(16,137,211,0.1)', width: '32px', height: '32px'}}>
                        <svg viewBox="0 0 24 24" style={{width: '18px', height: '18px'}}><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25S13.24 11.25 12 11.25 9.75 10.24 9.75 9s1.01-2.25 2.25-2.25zM17 17H7v-.75c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z"/></svg>
                      </div>
                    </div>
                    <div className="mobile-card-info">
                      <div className="mobile-card-info-item">
                        <span className="mobile-card-info-label">Dept</span>
                        <span className="mobile-card-info-value">{student.courseDepartment}</span>
                      </div>
                      <div className="mobile-card-info-item">
                        <span className="mobile-card-info-label">Year</span>
                        <span className="mobile-card-info-value">{student.year}</span>
                      </div>
                      <div className="mobile-card-info-item">
                        <span className="mobile-card-info-label">Status</span>
                        <span className={`status-badge ${student.isBanned ? 'banned' : 'active'}`} style={{fontSize: '11px', padding: '2px 8px'}}>
                            {student.isBanned ? 'Banned' : 'Active'}
                        </span>
                      </div>
                    </div>
                    <div className="mobile-card-actions" style={{ paddingTop: '12px', gap: '8px' }}>
                        <button className="btn-soft-resource btn-soft-blue" onClick={() => viewStudentProfile(student.id)} style={{ flex: 1, minWidth: 'auto', fontSize: '12px' }}>
                          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25S13.24 11.25 12 11.25 9.75 10.24 9.75 9s1.01-2.25 2.25-2.25zM17 17H7v-.75c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z"/></svg>
                          Profile
                        </button>
                        {student.isBanned ? (
                           <button className="btn-soft-resource btn-soft-blue" onClick={() => handleStudentUnban(student.id, student.name)} style={{ flex: 1, minWidth: 'auto', fontSize: '12px' }}>
                             <svg viewBox="0 0 24 24" width="14" height="14"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5-1.5 0-2.84.63-3.82 1.64L9.59 4.05C10.27 3.39 11.09 3 12 3c1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM3.27 2.27L2 3.54l2.71 2.71A2 2 0 0 0 4 7.69V18c0 1.1.9 2 2 2h12c.34 0 .65-.09.94-.21L20.46 22l1.27-1.27L3.27 2.27z"/></svg>
                             Unban
                           </button>
                        ) : (
                          <button className="btn-soft-resource btn-soft-blue" onClick={() => handleStudentBan(student.id, student.name)} style={{ flex: 1, minWidth: 'auto', fontSize: '12px' }}>
                             <svg viewBox="0 0 24 24" width="14" height="14"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                             Ban
                          </button>
                        )}
                        <button className="btn-soft-resource btn-soft-red" onClick={() => handleStudentDelete(student.id, student.name)} style={{ flex: 1, minWidth: 'auto', fontSize: '12px' }}>
                        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              </div>
          </div>

          {/* General Posts View */}
          <div className={`page-view ${activeView === 'general-posts' ? 'active' : ''}`} id="generalPostsView">
            <div className="content-header">
              <div>
                <h2>General Posts</h2>
                <p className="content-header-sub">View and manage all posts across the platform</p>
              </div>
            </div>
            
            <div className="table-card">
              <div className="table-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <h3 style={{ margin: 0 }}>All Posts</h3>
                <div className="table-search" style={{ margin: 0, minWidth: '250px', flex: 1, maxWidth: '350px' }}>
                  <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={globalPostSearch}
                    onChange={(e) => setGlobalPostSearch(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              {/* Desktop Table */}
              <div className="table-wrapper">
                {globalPostsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-text)' }}>Loading posts...</div>
                ) : filteredGlobalPosts.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Post Details</th>
                        <th>Classroom</th>
                        <th>Teacher</th>
                        <th className="materials-column">Teacher Materials</th>
                        <th className="work-column">Student Work</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGlobalPosts.map(post => {
                        const teacherInitials = post.teacherName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';
                        return (
                          <tr key={post._id}>
                            <td>
                              <div className="fw-600" style={{ color: '#1e293b', fontSize: '15px' }}>{post.title}</div>
                              {post.description && (
                                <div style={{ fontSize: '12px', color: 'var(--muted-text)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                                  {post.description}
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="fw-700" style={{ color: 'var(--primary-blue)' }}>{post.classroomId?.subject || 'N/A'}</div>
                              <div style={{ fontSize: '11px', color: 'var(--muted-text)', fontWeight: '600' }}>#{post.classroomId?.code || 'N/A'}</div>
                            </td>
                            <td>
                              <div className="user-cell">
                                <div className="user-avatar">{teacherInitials}</div>
                                <div>
                                  <div className="user-name">{post.teacherName}</div>
                                  <div className="user-email" style={{ fontSize: '11px' }}>Teacher</div>
                                </div>
                              </div>
                            </td>
                            <td className="materials-column">
                              <button 
                                className="btn-soft-resource btn-soft-blue" 
                                onClick={() => viewTeacherMaterials(post)}
                              >
                                <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                Materials
                              </button>
                            </td>
                            <td className="work-column">
                              {post.allowStudentUpload ? (
                                <button 
                                  className="btn-soft-resource btn-soft-emerald" 
                                  onClick={() => viewSubmissions(post)}
                                >
                                  <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                  Submissions
                                </button>
                              ) : (
                                <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unlocked</span>
                              )}
                            </td>
                            <td style={{ color: '#64748b', fontWeight: '600' }}>{new Date(post.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className="actions-cell" style={{ gap: '6px' }}>
                                <button className="btn-soft-resource btn-soft-blue" onClick={() => { setCurrentClassroom(post.classroomId); openPostModal(post); }} style={{ minWidth: '40px', padding: '10px' }}>
                                  <svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                                </button>
                                <button className="btn-soft-resource btn-soft-red" onClick={() => { setCurrentClassroom(post.classroomId); handleAdminDeletePost(post._id); }} style={{ minWidth: '40px', padding: '10px' }}>
                                  <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-text)' }}>No posts found on the platform.</div>
                )}
              </div>

              {/* Mobile Cards (General Posts) */}
              <div className="mobile-cards">
                {globalPostsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-text)' }}>Loading posts...</div>
                ) : filteredGlobalPosts.length > 0 ? filteredGlobalPosts.map(post => {
                  const teacherInitials = post.teacherName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';
                  return (
                    <div key={post._id} className="mobile-card">
                      <div className="mobile-card-header">
                        <div className="user-cell" style={{ flex: 1, minWidth: 0 }}>
                          <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>{teacherInitials}</div>
                          <div style={{ minWidth: 0 }}>
                            <div className="user-name" style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.title}</div>
                            <div className="user-email" style={{ fontSize: '11px' }}>{post.teacherName}</div>
                          </div>
                        </div>
                        <button className="action-btn" onClick={() => { setCurrentClassroom(post.classroomId); openPostModal(post); }} style={{ background: 'rgba(16,137,211,0.1)', width: '32px', height: '32px', flexShrink: 0 }}>
                          <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        </button>
                      </div>
                      <div className="mobile-card-info">
                        <div className="mobile-card-info-item">
                          <span className="mobile-card-info-label">Classroom</span>
                          <span className="mobile-card-info-value" style={{ color: 'var(--primary-blue)', fontWeight: '700' }}>{post.classroomId?.subject || 'N/A'}</span>
                        </div>
                        <div className="mobile-card-info-item">
                          <span className="mobile-card-info-label">Code</span>
                          <span className="mobile-card-info-value">#{post.classroomId?.code || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="mobile-card-resources" style={{ padding: '15px 0', borderTop: '1px solid #f1f5f9' }}>
                        <p style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Post Resources</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <button className="btn-soft-resource btn-soft-blue" onClick={() => viewTeacherMaterials(post)} style={{ width: '100%', minWidth: 'auto', padding: '12px' }}>
                            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            Materials
                          </button>
                          {post.allowStudentUpload && (
                            <button className="btn-soft-resource btn-soft-emerald" onClick={() => viewSubmissions(post)} style={{ width: '100%', minWidth: 'auto', padding: '12px' }}>
                              <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                              Work
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mobile-card-actions" style={{ paddingTop: '12px', gap: '8px' }}>
                        <button className="btn-soft-resource btn-soft-blue" onClick={() => { setCurrentClassroom(post.classroomId); openPostModal(post); }} style={{ flex: 1, minWidth: 'auto', fontSize: '12px' }}>
                          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                          Edit Post
                        </button>
                        <button className="btn-soft-resource btn-soft-red" onClick={() => { setCurrentClassroom(post.classroomId); handleAdminDeletePost(post._id); }} style={{ flex: 1, minWidth: 'auto', fontSize: '12px' }}>
                          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-text)' }}>No posts found on the platform.</div>
                )}
              </div>
            </div>
          </div>

          {/* General Exams View */}
          <div className={`page-view ${activeView === 'general-exams' ? 'active' : ''}`} id="generalExamsView">
            <div className="content-header">
              <div>
                <h2>General Exams</h2>
                <p className="content-header-sub">View and manage all exams across the platform</p>
              </div>
            </div>

            <div className="table-card">
              <div className="table-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <h3 style={{ margin: 0 }}>All Exams</h3>
                <div className="table-search" style={{ margin: 0, minWidth: '250px', flex: 1, maxWidth: '350px' }}>
                  <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                  <input
                    type="text"
                    placeholder="Search exams..."
                    value={globalExamSearch}
                    onChange={(e) => setGlobalExamSearch(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              {/* Desktop Table */}
              <div className="table-wrapper">
                {globalExamsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-text)' }}>Loading exams...</div>
                ) : filteredGlobalExams.length > 0 ? (
                  <table>
                    <thead><tr><th>Exam Name</th><th>Classroom</th><th>Teacher</th><th>Type</th><th>Date</th><th>Actions</th></tr></thead>
                    <tbody>
                      {filteredGlobalExams.map(exam => {
                        const teacherInitials = exam.teacherName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';
                        return (
                          <tr key={exam._id}>
                            <td className="fw-700" style={{ color: '#1e293b' }}>{exam.examName}</td>
                            <td>
                              <div className="fw-700" style={{ color: 'var(--primary-blue)' }}>{exam.classroomId?.subject || exam.subject || 'N/A'}</div>
                              <div style={{ fontSize: '11px', color: 'var(--muted-text)', fontWeight: '600' }}>#{exam.classroomId?.code || 'N/A'}</div>
                            </td>
                            <td>
                              <div className="user-cell">
                                <div className="user-avatar">{teacherInitials}</div>
                                <div>
                                  <div className="user-name">{exam.teacherName}</div>
                                  <div className="user-email" style={{ fontSize: '11px' }}>Teacher</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="department-badge" style={{ 
                                background: exam.examType === 'ai' ? 'rgba(16, 137, 211, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                color: exam.examType === 'ai' ? 'var(--primary-blue)' : '#22c55e',
                                border: `1px solid ${exam.examType === 'ai' ? 'rgba(16, 137, 211, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
                              }}>
                                {exam.examType === 'ai' ? '🚀 AI Generated' : '📝 Manual'}
                              </span>
                            </td>
                            <td style={{ color: '#64748b', fontWeight: '600' }}>{new Date(exam.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className="actions-cell">
                                <button
                                  className="btn-soft-resource btn-soft-blue"
                                  onClick={() => viewExamSubmissions(exam)}
                                  style={{ fontSize: '12px', padding: '10px 20px', minWidth: 'auto' }}
                                >
                                  <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                                  Submissions
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-text)' }}>No exams found on the platform.</div>
                )}
              </div>

              {/* Mobile Cards (General Exams) */}
              <div className="mobile-cards">
                {globalExamsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-text)' }}>Loading exams...</div>
                ) : filteredGlobalExams.length > 0 ? filteredGlobalExams.map(exam => {
                  const teacherInitials = exam.teacherName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';
                  return (
                    <div key={exam._id} className="mobile-card">
                      <div className="mobile-card-header">
                        <div className="user-cell" style={{ flex: 1, minWidth: 0 }}>
                          <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>{teacherInitials}</div>
                          <div style={{ minWidth: 0 }}>
                            <div className="user-name" style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exam.examName}</div>
                            <div className="user-email" style={{ fontSize: '11px' }}>{exam.teacherName}</div>
                          </div>
                        </div>
                        <span className="department-badge" style={{ 
                          flexShrink: 0, 
                          fontSize: '10px',
                          background: exam.examType === 'ai' ? 'rgba(16, 137, 211, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                          color: exam.examType === 'ai' ? 'var(--primary-blue)' : '#22c55e',
                          padding: '4px 8px'
                        }}>
                          {exam.examType === 'ai' ? 'AI' : 'Manual'}
                        </span>
                      </div>
                      <div className="mobile-card-info">
                        <div className="mobile-card-info-item">
                          <span className="mobile-card-info-label">Subject</span>
                          <span className="mobile-card-info-value" style={{ color: 'var(--primary-blue)', fontWeight: '700' }}>{exam.classroomId?.subject || exam.subject || 'N/A'}</span>
                        </div>
                        <div className="mobile-card-info-item">
                          <span className="mobile-card-info-label">Code</span>
                          <span className="mobile-card-info-value">#{exam.classroomId?.code || 'N/A'}</span>
                        </div>
                        <div className="mobile-card-info-item">
                          <span className="mobile-card-info-label">Date</span>
                          <span className="mobile-card-info-value">{new Date(exam.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="mobile-card-actions" style={{ paddingTop: '12px' }}>
                        <button 
                          className="btn-soft-resource btn-soft-blue" 
                          onClick={() => viewExamSubmissions(exam)} 
                          style={{ width: '100%', minWidth: 'auto', padding: '12px', fontSize: '12px' }}
                        >
                          <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                          View Submissions
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-text)' }}>No exams found on the platform.</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Teacher Requests Modal */}
      <div className={`modal-overlay ${modals.teacherModal ? 'active' : ''}`} onClick={(e) => e.target === e.currentTarget && closeModal('teacherModal')}>
        <div className="modal">
          <div className="modal-header">
            <div className="modal-header-left">
              <h3>Teacher Requests</h3>
              <span className="modal-header-badge">
                <span className="status-dot"></span>
                <span>{pendingTeachers} Pending</span>
              </span>
            </div>
            <button className="modal-close" onClick={() => closeModal('teacherModal')}>
              <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
          <div className="modal-body">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Full Name</th><th>Email</th><th>Department</th><th>Status</th><th>Approve</th><th>Reject</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherRequests.map(req => (
                    <tr key={req.id}>
                      <td><div className="user-cell"><div className="user-avatar">{req.initials}</div><div className="user-name">{req.name}</div></div></td>
                      <td style={{ fontSize: 13, color: 'var(--muted-text)' }}>{req.email}</td>
                      <td><span className="department-badge">{req.dept}</span></td>
                      <td><span className="status-pending"><span className="status-dot"></span>Pending</span></td>
                      <td><button className="btn-approve" onClick={() => handleApproveClick(req.id, req.name)}>Approve</button></td>
                      <td><button className="btn-reject" onClick={() => handleRejectClick(req.id, req.name)}>Reject</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (Teacher Requests) */}
            <div className="modal-mobile-cards">
              {teacherRequests.map(req => (
                <div key={req.id} className="modal-mobile-card">
                  <div className="mobile-card-header">
                    <div className="user-cell">
                      <div className="user-avatar">{req.initials}</div>
                      <div>
                        <div className="user-name">{req.name}</div>
                        <div className="user-email">{req.email}</div>
                      </div>
                    </div>
                    <span className="department-badge">{req.dept}</span>
                  </div>
                  <div className="modal-mobile-card-actions">
                    <button className="btn-approve" onClick={() => handleApproveClick(req.id, req.name)}>Approve</button>
                    <button className="btn-reject" onClick={() => handleRejectClick(req.id, req.name)}>Reject</button>
                  </div>
                </div>
              ))}
            </div>

            {teacherRequests.length === 0 && (
              <div className="empty-modal-state">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                <p>No pending requests! All clear 🎉</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Banned Teachers Modal */}
      <div className={`modal-overlay ${modals.bannedTeacherModal ? 'active' : ''}`} onClick={(e) => e.target === e.currentTarget && closeModal('bannedTeacherModal')}>
        <div className="modal">
          <div className="modal-header">
            <div className="modal-header-left">
              <h3>Banned Teachers</h3>
              <span className="modal-header-badge">
                <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, fill: 'var(--primary-blue)' }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/></svg>
                <span>{bannedTeachersCount} Banned</span>
              </span>
            </div>
            <button className="modal-close" onClick={() => closeModal('bannedTeacherModal')}>
              <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
          <div className="modal-body">
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Full Name</th><th>Department</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {bannedTeachers.map(teacher => (
                    <tr key={teacher.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">{teacher.initials}</div>
                          <div>
                            <div className="user-name">{teacher.name}</div>
                            <div className="user-email">{teacher.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="department-badge">{teacher.dept}</span></td>
                      <td>
                        <span className="status-banned">
                          <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, fill: 'var(--primary-blue)' }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/></svg>Banned
                        </span>
                      </td>
                      <td><button className="btn-unban" onClick={() => handleUnban(teacher.id, teacher.name)}>Unban</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (Banned Teachers) */}
            <div className="modal-mobile-cards">
              {bannedTeachers.map(teacher => (
                <div key={teacher.id} className="modal-mobile-card">
                  <div className="mobile-card-header">
                    <div className="user-cell">
                       <div className="user-avatar">{teacher.initials}</div>
                       <div>
                         <div className="user-name">{teacher.name}</div>
                         <div className="user-email">{teacher.email}</div>
                       </div>
                    </div>
                    <span className="department-badge">{teacher.dept}</span>
                  </div>
                  <div className="modal-mobile-card-actions">
                     <button className="btn-unban" style={{width: '100%'}} onClick={() => handleUnban(teacher.id, teacher.name)}>Unban Teacher</button>
                  </div>
                </div>
              ))}
            </div>

            {bannedTeachers.length === 0 && (
              <div className="empty-modal-state">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                <p>No banned teachers! All clear 🎉</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Banned Students Modal */}
      <div className={`modal-overlay ${modals.bannedStudentModal ? 'active' : ''}`} onClick={(e) => e.target === e.currentTarget && closeModal('bannedStudentModal')}>
        <div className="modal">
          <div className="modal-header">
            <div className="modal-header-left">
              <h3>Banned Students</h3>
              <span className="modal-header-badge">
                <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, fill: 'var(--primary-blue)' }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/></svg>
                <span>{studentStats.bannedStudents} Banned</span>
              </span>
            </div>
            <button className="modal-close" onClick={() => closeModal('bannedStudentModal')}>
              <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
          <div className="modal-body">
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Student Info</th><th>Department</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {bannedStudents.map(student => (
                    <tr key={student.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">{student.initials}</div>
                          <div>
                            <div className="user-name">{student.name}</div>
                            <div className="user-email">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="department-badge">{student.courseDepartment}</span></td>
                      <td>
                        <span className="status-banned">
                          <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, fill: 'var(--primary-blue)' }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/></svg>Banned
                        </span>
                      </td>
                      <td><button className="btn-unban" onClick={() => handleStudentUnban(student.id, student.name)}>Unban</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

             {/* Mobile Cards (Banned Students) */}
             <div className="modal-mobile-cards">
              {bannedStudents.map(student => (
                <div key={student.id} className="modal-mobile-card">
                  <div className="mobile-card-header">
                    <div className="user-cell">
                       <div className="user-avatar">{student.initials}</div>
                       <div>
                         <div className="user-name">{student.name}</div>
                         <div className="user-email">{student.email}</div>
                       </div>
                    </div>
                    <span className="department-badge">{student.courseDepartment}</span>
                  </div>
                  <div className="modal-mobile-card-actions">
                     <button className="btn-unban" style={{width: '100%'}} onClick={() => handleStudentUnban(student.id, student.name)}>Unban Student</button>
                  </div>
                </div>
              ))}
            </div>

            {bannedStudents.length === 0 && (
              <div className="empty-modal-state">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                <p>No banned students! all clear 🎉</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Teacher Profile Modal */}
      {selectedTeacher && (
        <div className={`modal-overlay ${modals.teacherProfileModal ? 'active' : ''}`} onClick={(e) => e.target === e.currentTarget && closeModal('teacherProfileModal')}>
          <div className="modal">
            <div className="modal-header">
              <h3>Teacher Profile</h3>
              <button className="modal-close" onClick={() => closeModal('teacherProfileModal')}>
                <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            </div>
            <div className="modal-body" style={{padding: '24px'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #1089D3, #12B1D1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                  {selectedTeacher.teacher.name?.charAt(0)}
                </div>
                <div>
                  <h4 style={{fontSize: '22px', margin: '0'}}>{selectedTeacher.teacher.name}</h4>
                  <span className={`status-badge ${selectedTeacher.teacher.status === 'approved' ? 'active' : selectedTeacher.teacher.status === 'banned' ? 'banned' : ''}`} style={{ marginTop: '5px', display: 'inline-block' }}>
                    {selectedTeacher.teacher.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: 'rgba(16, 137, 211, 0.05)', padding: '20px', borderRadius: '12px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--muted-text)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Basic Info</p>
                  <p style={{ margin: '0 0 10px 0' }}><strong>Email:</strong><br/>{selectedTeacher.teacher.email}</p>
                  <p style={{ margin: '0 0 10px 0' }}><strong>Mobile Number:</strong><br/>{selectedTeacher.teacher.mobileNumber || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--muted-text)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Professional Info</p>
                  <p style={{ margin: '0 0 10px 0' }}><strong>Institution:</strong><br/>{selectedTeacher.teacher.institutionName || 'N/A'}</p>
                  <p style={{ margin: '0 0 10px 0' }}><strong>Designation:</strong><br/>{selectedTeacher.teacher.designation || 'N/A'}</p>
                  <p style={{ margin: '0 0 10px 0' }}><strong>Department:</strong><br/>{selectedTeacher.teacher.department}</p>
                  <p style={{ margin: '0 0 10px 0' }}><strong>Subject:</strong><br/>{selectedTeacher.teacher.subject}</p>
                </div>
              </div>

              <h4 style={{marginTop: '24px', marginBottom: '12px', borderBottom: '1px solid #eaeaea', paddingBottom: '8px'}}>Classrooms Managed ({selectedTeacher.totalClassrooms})</h4>
               {selectedTeacher.classrooms.map((c, idx) => (
                <div key={idx} style={{padding: '12px', background: 'rgba(16, 137, 211, 0.05)', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px 0' }}><strong>{c.classroomName}</strong></p>
                    <p style={{fontSize: '13px', color: 'var(--muted-text)', margin: 0}}>Code: {c.classroomCode} | Students: {c.studentsCount}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="action-btn" 
                      onClick={() => viewClassroomStudents(c)}
                      style={{ 
                        background: 'rgba(16, 137, 211, 0.1)', 
                        color: 'var(--primary-blue)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        padding: '0 16px', 
                        height: '38px',
                        borderRadius: '10px', 
                        border: '1px solid rgba(16,137,211,0.25)', 
                        fontSize: '13px', 
                        fontWeight: '700', 
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 2px 8px rgba(16, 137, 211, 0.05)'
                      }}
                      title="View Students enrolled in this classroom"
                    >
                      <svg viewBox="0 0 24 24" style={{width: '15px', height: '15px', fill: 'currentColor'}}><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                      Students
                    </button>
                    <button 
                      className="action-btn" 
                      onClick={() => openClassroomContent(c)}
                      style={{ background: 'rgba(16, 137, 211, 0.1)', color: 'var(--primary-blue)' }}
                    >
                      <span className="tooltip">View Posts</span>
                      <svg viewBox="0 0 24 24"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h18v8zM5 10h2v4H5v-4zm8 0h6v4h-6v-4z"/></svg>
                    </button>
                    <button 
                      className="action-btn" 
                      onClick={() => viewClassroomExams(c)}
                      style={{ background: 'rgba(16, 137, 211, 0.1)', color: 'var(--primary-blue)' }}
                    >
                      <span className="tooltip">View Exams</span>
                      <svg viewBox="0 0 24 24"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>
                    </button>
                    <button 
                      className="action-btn" 
                      onClick={() => handleAdminDeleteClassroom(c._id, c.classroomName)}
                      style={{ background: 'rgba(255, 77, 77, 0.1)', color: '#FF4D4D' }}
                    >
                      <span className="tooltip">Delete Classroom</span>
                      <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                  </div>
                </div>
              ))}
              {selectedTeacher.classrooms.length === 0 && <p style={{color: 'var(--muted-text)'}}>No classrooms created yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Classroom Students Modal */}
      {classroomStudentsData && (
        <div
          className="modal-overlay active"
          onClick={(e) => e.target === e.currentTarget && setClassroomStudentsData(null)}
          style={{ zIndex: 1100 }}
        >
          <div className="modal" style={{ maxWidth: '800px', width: '95vw' }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <h3>
                  {classroomStudentsData.classroom?.classroomName || `${classroomStudentsData.classroom?.subject} - ${classroomStudentsData.classroom?.classGrade}${classroomStudentsData.classroom?.division}`}
                </h3>
                <span className="modal-header-badge">
                  <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, fill: 'var(--primary-blue)' }}><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                  <span>{classroomStudentsData.totalStudents || classroomStudentsData.students?.length || 0} Students</span>
                </span>
              </div>
              <button className="modal-close" onClick={() => setClassroomStudentsData(null)}>
                <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            </div>
            <div className="modal-body">
              {classroomStudentsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-text)' }}>
                  <div style={{ width: '40px', height: '40px', border: '3px solid rgba(16,137,211,0.15)', borderTopColor: 'var(--primary-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                  Loading students...
                </div>
              ) : classroomStudentsData.students?.length > 0 ? (
                <>
                  {/* Desktop Table */}
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Student ID</th>
                          <th>Department</th>
                          <th>Semester</th>
                          <th>Status</th>
                          <th>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classroomStudentsData.students.map((s, idx) => (
                          <tr key={idx}>
                            <td>
                              <div className="user-cell">
                                <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #1089D3, #12B1D1)' }}>{s.name?.charAt(0)?.toUpperCase() || 'S'}</div>
                                <div>
                                  <div className="user-name">{s.name}</div>
                                  <div className="user-email">{s.email}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontSize: '13px' }}>{s.studentId || 'N/A'}</td>
                            <td><span className="department-badge">{s.courseDepartment || 'N/A'}</span></td>
                            <td style={{ fontSize: '13px' }}>{s.year || 'N/A'}</td>
                            <td>
                              <span className={`status-badge ${s.status === 'banned' ? 'banned' : 'active'}`}>
                                {s.status === 'banned' ? 'Banned' : 'Active'}
                              </span>
                            </td>
                            <td style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
                              {s.joinedAt ? new Date(s.joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="modal-mobile-cards">
                    {classroomStudentsData.students.map((s, idx) => (
                      <div key={idx} className="modal-mobile-card">
                        <div className="mobile-card-header">
                          <div className="user-cell">
                            <div className="user-avatar student" style={{ background: 'linear-gradient(135deg, #1089D3, #12B1D1)' }}>{s.name?.charAt(0)?.toUpperCase() || 'S'}</div>
                            <div>
                              <div className="user-name">{s.name}</div>
                              <div className="user-email">{s.email}</div>
                            </div>
                          </div>
                          <span className={`status-badge ${s.status === 'banned' ? 'banned' : 'active'}`}>
                            {s.status === 'banned' ? 'Banned' : 'Active'}
                          </span>
                        </div>
                        <div className="mobile-card-info">
                          <div className="mobile-card-info-item">
                            <span className="mobile-card-info-label">Student ID</span>
                            <span className="mobile-card-info-value">{s.studentId || 'N/A'}</span>
                          </div>
                          <div className="mobile-card-info-item">
                            <span className="mobile-card-info-label">Department</span>
                            <span className="mobile-card-info-value">{s.courseDepartment || 'N/A'}</span>
                          </div>
                          <div className="mobile-card-info-item">
                            <span className="mobile-card-info-label">Semester</span>
                            <span className="mobile-card-info-value">{s.year || 'N/A'}</span>
                          </div>
                          <div className="mobile-card-info-item">
                            <span className="mobile-card-info-label">Joined</span>
                            <span className="mobile-card-info-value">{s.joinedAt ? new Date(s.joinedAt).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-modal-state">
                  <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 7c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zm6 5H6v-.99c.2-.72 3.3-2.01 6-2.01s5.8 1.29 6 2v1z"/></svg>
                  <p>No students enrolled in this classroom yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student Requests Modal */}
      <div className={`modal-overlay ${modals.studentRequestModal ? 'active' : ''}`} onClick={(e) => e.target === e.currentTarget && closeModal('studentRequestModal')}>
        <div className="modal">
          <div className="modal-header">
            <div className="modal-header-left">
              <h3>Student Requests</h3>
              <span className="modal-header-badge">
                <span className="status-dot"></span>
                <span>{pendingStudents} Pending</span>
              </span>
            </div>
            <button className="modal-close" onClick={() => closeModal('studentRequestModal')}>
              <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
         </div>
          <div className="modal-body">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student Info</th><th>Department</th><th>Year</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentRequests.map(req => (
                    <tr key={req.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">{req.initials}</div>
                          <div>
                            <div className="user-name">{req.name}</div>
                            <div className="user-email">{req.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="department-badge">{req.courseDepartment}</span></td>
                      <td>{req.year}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-approve" onClick={() => handleStudentApproveClick(req.id, req.name)}>Approve</button>
                          <button className="btn-reject" onClick={() => handleStudentRejectClick(req.id, req.name)}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (Student Requests) */}
            <div className="modal-mobile-cards">
              {studentRequests.map(req => (
                <div key={req.id} className="modal-mobile-card">
                  <div className="mobile-card-header">
                    <div className="user-cell">
                      <div className="user-avatar">{req.initials}</div>
                      <div>
                        <div className="user-name">{req.name}</div>
                        <div className="user-email">{req.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mobile-card-info">
                      <div className="mobile-card-info-item">
                        <span className="mobile-card-info-label">Dept</span>
                        <span className="mobile-card-info-value">{req.courseDepartment}</span>
                      </div>
                      <div className="mobile-card-info-item">
                        <span className="mobile-card-info-label">Year</span>
                        <span className="mobile-card-info-value">{req.year}</span>
                      </div>
                  </div>
                  <div className="modal-mobile-card-actions">
                    <button className="btn-approve" onClick={() => handleStudentApproveClick(req.id, req.name)}>Approve</button>
                    <button className="btn-reject" onClick={() => handleStudentRejectClick(req.id, req.name)}>Reject</button>
                  </div>
                </div>
              ))}
            </div>

            {studentRequests.length === 0 && (
              <div className="empty-modal-state">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                <p>No pending student requests! All clear 🎉</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student Profile Modal */}
      {selectedStudent && (
        <div className={`modal-overlay ${modals.studentProfileModal ? 'active' : ''}`} onClick={(e) => e.target === e.currentTarget && closeModal('studentProfileModal')}>
          <div className="modal">
            <div className="modal-header">
              <h3>Student Profile</h3>
              <button className="modal-close" onClick={() => closeModal('studentProfileModal')}>
                <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            </div>
            <div className="modal-body" style={{padding: '24px'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #1089D3, #12B1D1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                  {selectedStudent.student.name?.charAt(0)}
                </div>
                <div>
                  <h4 style={{fontSize: '22px', margin: '0'}}>{selectedStudent.student.name}</h4>
                  <span className={`status-badge ${selectedStudent.student.status === 'approved' ? 'active' : selectedStudent.student.status === 'banned' ? 'banned' : ''}`} style={{ marginTop: '5px', display: 'inline-block' }}>
                    {selectedStudent.student.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: 'rgba(16, 137, 211, 0.05)', padding: '20px', borderRadius: '12px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--muted-text)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Basic Info</p>
                  <p style={{ margin: '0 0 10px 0' }}><strong>Email:</strong><br/>{selectedStudent.student.email}</p>
                  <p style={{ margin: '0 0 10px 0' }}><strong>Mobile Number:</strong><br/>{selectedStudent.student.mobileNumber || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--muted-text)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Academic Info</p>
                  <p style={{ margin: '0 0 10px 0' }}><strong>Institution:</strong><br/>{selectedStudent.student.institutionName || 'N/A'}</p>
                  <p style={{ margin: '0 0 10px 0' }}><strong>Student ID:</strong><br/>{selectedStudent.student.studentId || 'N/A'}</p>
                  <p style={{ margin: '0 0 10px 0' }}><strong>Program:</strong><br/>{selectedStudent.student.programName || 'N/A'}</p>
                  <p style={{ margin: '0 0 10px 0' }}><strong>Department:</strong><br/>{selectedStudent.student.courseDepartment}</p>
                  <p style={{ margin: '0 0 10px 0' }}><strong>Semester:</strong><br/>{selectedStudent.student.year}</p>
                </div>
              </div>

              <h4 style={{marginTop: '24px', marginBottom: '12px', borderBottom: '1px solid #eaeaea', paddingBottom: '8px'}}>Enrolled Classrooms ({selectedStudent.totalJoinedClassrooms})</h4>
              {selectedStudent.joinedClassrooms.map((c, idx) => (
                <div key={idx} style={{padding: '12px', background: 'rgba(16, 137, 211, 0.05)', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <p style={{ margin: '0 0 4px 0' }}><strong>{c.subject}</strong> (Grade {c.classGrade})</p>
                    <p style={{fontSize: '13px', color: 'var(--muted-text)', margin: 0}}>Code: {c.code} | Teacher: {c.teacherName}</p>
                  </div>
                  <button 
                    className="action-btn" 
                    onClick={() => viewStudentExams(selectedStudent.student)}
                    style={{ background: 'rgba(16, 137, 211, 0.1)', color: 'var(--primary-blue)', padding: '0 12px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    <svg viewBox="0 0 24 24" style={{width: '14px', height: '14px', fill: 'currentColor'}}><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>
                    Exams
                  </button>
                </div>
              ))}
              {selectedStudent.joinedClassrooms.length === 0 && <p style={{color: 'var(--muted-text)'}}>Not enrolled in any classrooms yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirm.visible}
        onClose={hideConfirm}
        onConfirm={() => {
          if (confirm.onConfirm) confirm.onConfirm();
          hideConfirm();
        }}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.options?.confirmText}
        isDanger={confirm.options?.isDanger}
      />

      {/* Approval Input Modal */}
      <InputModal
        isOpen={modals.approvalInputModal}
        onClose={() => closeModal('approvalInputModal')}
        onConfirm={currentStudent ? handleStudentApproveSubmit : handleApproveSubmit}
        title={`Approve ${currentTeacher?.name || currentStudent?.name || 'User'}`}
        message="Enter a welcome message (optional):"
        placeholder="e.g., Welcome to NextEd AI! We're excited to have you."
        required={false}
        isDanger={false}
      />

      {/* Rejection Input Modal */}
      <InputModal
        isOpen={modals.rejectionInputModal}
        onClose={() => closeModal('rejectionInputModal')}
        onConfirm={currentStudent ? handleStudentRejectSubmit : handleRejectSubmit}
        title={`Reject ${currentTeacher?.name || currentStudent?.name || 'User'}`}
        message="Enter the reason for rejection:"
        placeholder="e.g., Insufficient qualifications or incomplete application"
        required={true}
        isDanger={true}
      />

      {/* Classroom Content Modal */}
      <div className={`modal-overlay ${modals.classroomContentModal ? 'active' : ''}`} onClick={(e) => e.target === e.currentTarget && closeModal('classroomContentModal')}>
        <div className="modal" style={{ maxWidth: '800px' }}>
          <div className="modal-header">
            <div className="modal-header-left">
              <h3>{currentClassroom?.classroomName}</h3>
              <span className="modal-header-badge">Posts & Announcements</span>
            </div>
            <button className="modal-close" onClick={() => closeModal('classroomContentModal')}>
              <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
          <div className="modal-body" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
              <h4 style={{ margin: 0 }}>All Announcements</h4>
              
              <div className="table-search" style={{ margin: 0, minWidth: '250px', flex: 1, maxWidth: '400px' }}>
                <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <button className="btn-approve" onClick={() => openPostModal()} style={{ whiteSpace: 'nowrap' }}>
                + New Announcement
              </button>
            </div>

            {postLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="status-dot"></div>
                <p style={{ marginTop: '10px', color: 'var(--muted-text)' }}>Loading posts...</p>
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="posts-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredPosts.map((post) => (
                  <div key={post._id} className="admin-post-card" style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid rgba(16, 137, 211, 0.1)', boxShadow: '0 2px 12px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{post.title}</h5>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {post.allowStudentUpload && (
                          <button 
                            className="action-btn-premium" 
                            onClick={() => viewSubmissions(post)}
                            style={{ 
                              background: '#f8fafc',
                              color: '#334155',
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 14px',
                              width: 'auto',
                              fontSize: '13px',
                              fontWeight: '600',
                              borderRadius: '10px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            Submissions
                          </button>
                        )}
                        <button className="action-btn" onClick={() => openPostModal(post)}>
                          <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        </button>
                        <button className="action-btn" onClick={() => handleAdminDeletePost(post._id)} style={{ color: '#FF4D4D' }}>
                          <svg viewBox="0 0 24 24" style={{ fill: '#FF4D4D' }}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', color: '#444', lineHeight: '1.6', margin: '0 0 12px 0' }}>{post.description}</p>
                    
                    {/* Attachments Display */}
                    {post.files && post.files.length > 0 && (
                      <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {post.files.map((file, fIdx) => (
                          <a key={fIdx} href={file.data} download={file.name} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            padding: '6px 12px', 
                            background: 'rgba(16, 137, 211, 0.05)', 
                            borderRadius: '8px', 
                            fontSize: '12px', 
                            border: '1px solid rgba(16, 137, 211, 0.1)',
                            color: 'inherit',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-blue)'; e.currentTarget.style.background = 'rgba(16, 137, 211, 0.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(16, 137, 211, 0.1)'; e.currentTarget.style.background = 'rgba(16, 137, 211, 0.05)'; }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-blue)' }}>
                              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                              <polyline points="13 2 13 9 20 9"></polyline>
                            </svg>
                            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '500' }}>{file.name}</span>
                            <span style={{ color: 'var(--primary-blue)', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', marginLeft: '4px' }}>Download</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Video Link Display */}
                    {post.videoLink && (
                      <div style={{ marginBottom: '12px' }}>
                        <a href={post.videoLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--primary-blue)', textDecoration: 'none', background: 'rgba(16, 137, 211, 0.08)', padding: '6px 12px', borderRadius: '8px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                          Watch Video
                        </a>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--muted-text)', borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '10px' }}>
                      <span>Posted by: <strong>{(post.teacherName || '').replace(/ undefined$/, '').trim()}</strong></span>
                      <span>{new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(16, 137, 211, 0.03)', borderRadius: '16px' }}>
                <p style={{ margin: 0, color: 'var(--muted-text)' }}>No announcements found in this classroom.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submissions View Modal */}
      {modals.viewingSubmissions && (
        <div className={`modal-overlay active`} onClick={(e) => e.target === e.currentTarget && closeModal('viewingSubmissions')}>
          <div className="modal" style={{ maxWidth: '850px', borderRadius: '32px', border: '1px solid rgba(16, 137, 211, 0.1)', overflow: 'hidden' }}>
            <div className="modal-header" style={{ 
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
              padding: '28px 36px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div className="modal-header-left">
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>Student Submissions</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{currentPost?.title}</span>
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
              <button className="modal-close" onClick={() => closeModal('viewingSubmissions')} style={{ 
                background: 'white',
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#64748b"/></svg>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '36px', maxHeight: '70vh', overflowY: 'auto', background: '#fcfdfe' }}>
              {submissionsLoading ? (
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
                  <style>{`
                    @keyframes spin { to { transform: rotate(360deg); } }
                  `}</style>
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
                    }}>
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
                            fontWeight: '800',
                            boxShadow: '0 4px 12px rgba(16, 137, 211, 0.2)'
                          }}>
                            {sub.studentName?.charAt(0)}
                          </div>
                          <div>
                            <h5 style={{ margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: '800' }}>{sub.studentName}</h5>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Submitted on</span>
                              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                {new Date(sub.submittedAt).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span style={{ color: '#cbd5e1' }}>•</span>
                              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                {new Date(sub.submittedAt).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div style={{ padding: '6px 12px', background: '#f0fdf4', color: '#16a34a', borderRadius: '10px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span>
                          Submitted
                        </div>
                      </div>
                      
                      {sub.message && (
                        <div style={{ 
                          padding: '16px 20px', 
                          background: '#f8fafc', 
                          borderRadius: '14px', 
                          marginBottom: '20px', 
                          fontSize: '14px', 
                          color: '#334155', 
                          lineHeight: '1.6', 
                          borderLeft: '4px solid var(--primary-blue)',
                          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
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
                                justifyContent: 'center',
                                fontSize: '18px'
                              }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-blue)' }}>
                                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
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
      {/* Admin Post Create/Edit Modal */}
      {modals.postModal && (
        <div className={`modal-overlay active`} onClick={(e) => e.target === e.currentTarget && closeModal('postModal')}>
          <div className="modal" style={{ maxWidth: '550px', borderRadius: '28px', overflow: 'hidden', border: '1px solid rgba(16, 137, 211, 0.1)' }}>
            <div className="modal-header" style={{ 
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
              padding: '24px 32px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>
                {currentPost ? 'Update' : 'Create'} Announcement
              </h3>
              <button className="modal-close" onClick={() => closeModal('postModal')} style={{ 
                background: 'white',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
              }}>
                <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#64748b"/></svg>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '32px', background: 'white' }}>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const fileInput = e.target.elements.files;
                const files = [];
                
                if (fileInput.files.length > 0) {
                  for (let i = 0; i < fileInput.files.length; i++) {
                    const file = fileInput.files[i];
                    const base64 = await new Promise((resolve) => {
                      const reader = new FileReader();
                      reader.onload = (e) => resolve(e.target.result);
                      reader.readAsDataURL(file);
                    });
                    files.push({
                      name: file.name,
                      type: file.type,
                      size: (file.size / 1024).toFixed(1) + ' KB',
                      data: base64
                    });
                  }
                }

                handleAdminSavePost({
                  title: formData.get('title'),
                  description: formData.get('description'),
                  videoLink: formData.get('videoLink'),
                  files: files.length > 0 ? files : (currentPost?.files || []),
                  allowStudentUpload: allowStudentUpload
                });
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Announcement Title</label>
                  <input 
                    name="title" 
                    defaultValue={currentPost?.title} 
                    required 
                    placeholder="E.g. Internal Exam Schedule 2024"
                    style={{ 
                      width: '100%', 
                      padding: '14px 18px', 
                      borderRadius: '14px', 
                      border: '1.5px solid #e2e8f0', 
                      background: '#f8fafc', 
                      fontSize: '15px',
                      color: '#1e293b',
                      outline: 'none', 
                      transition: 'all 0.2s ease' 
                    }} 
                    onFocus={(e) => { e.target.style.borderColor = 'var(--primary-blue)'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(16, 137, 211, 0.05)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Description</label>
                  <textarea 
                    name="description" 
                    defaultValue={currentPost?.description} 
                    required 
                    placeholder="Provide full details about this announcement..."
                    style={{ 
                      width: '100%', 
                      padding: '14px 18px', 
                      borderRadius: '14px', 
                      border: '1.5px solid #e2e8f0', 
                      background: '#f8fafc', 
                      fontSize: '15px',
                      color: '#1e293b',
                      outline: 'none', 
                      minHeight: '130px', 
                      resize: 'none', 
                      transition: 'all 0.2s ease' 
                    }} 
                    onFocus={(e) => { e.target.style.borderColor = 'var(--primary-blue)'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(16, 137, 211, 0.05)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                  ></textarea>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Reference Link (Optional)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94a3b8' }}>
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                      </svg>
                    </span>
                    <input 
                      name="videoLink" 
                      defaultValue={currentPost?.videoLink} 
                      placeholder="https://nexted.ai/resources/..."
                      style={{ 
                        width: '100%', 
                        padding: '14px 18px 14px 44px', 
                        borderRadius: '14px', 
                        border: '1.5px solid #e2e8f0', 
                        background: '#f8fafc', 
                        fontSize: '14px',
                        outline: 'none', 
                        transition: 'all 0.2s ease' 
                      }} 
                      onFocus={(e) => { e.target.style.borderColor = 'var(--primary-blue)'; e.target.style.background = 'white'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Student Submission Policy
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label style={{ 
                      flex: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '14px',
                      borderRadius: '14px',
                      border: allowStudentUpload ? '2px solid var(--primary-blue)' : '2px solid #f1f5f9',
                      background: allowStudentUpload ? 'rgba(16, 137, 211, 0.04)' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: allowStudentUpload ? '0 4px 12px rgba(16, 137, 211, 0.1)' : 'none'
                    }}>
                      <input type="radio" checked={allowStudentUpload} onChange={() => setAllowStudentUpload(true)} style={{ accentColor: 'var(--primary-blue)', width: '18px', height: '18px' }} />
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: allowStudentUpload ? 'var(--primary-blue)' : '#475569' }}>Allow Uploads</span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>Assign task to students</span>
                      </div>
                    </label>
                    <label style={{ 
                      flex: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '14px',
                      borderRadius: '14px',
                      border: !allowStudentUpload ? '2px solid #64748b' : '2px solid #f1f5f9',
                      background: !allowStudentUpload ? '#f8fafc' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                      <input type="radio" checked={!allowStudentUpload} onChange={() => setAllowStudentUpload(false)} style={{ accentColor: '#64748b', width: '18px', height: '18px' }} />
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: !allowStudentUpload ? '#334155' : '#475569' }}>Broadcast Only</span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>Simple announcement</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Attachments</label>
                  <input 
                    type="file" 
                    name="files" 
                    multiple 
                    className="file-input-custom" 
                    style={{ 
                      width: '100%',
                      padding: '16px',
                      border: '2px dashed #cbd5e1',
                      borderRadius: '16px',
                      background: '#fcfdfe',
                      fontSize: '13px',
                      color: '#64748b',
                      cursor: 'pointer'
                    }}
                  />
                </div>

                <div className="modal-footer" style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn-cancel" onClick={() => closeModal('postModal')} style={{ 
                    flex: 1, 
                    padding: '14px', 
                    borderRadius: '14px', 
                    border: '1px solid #e2e8f0', 
                    background: 'white', 
                    color: '#64748b', 
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                    Discard
                  </button>
                  <button type="submit" className="btn-submit" style={{ 
                    flex: 2, 
                    padding: '14px', 
                    borderRadius: '14px', 
                    border: 'none', 
                    background: 'linear-gradient(135deg, var(--primary-blue), var(--secondary-blue))', 
                    color: 'white', 
                    fontWeight: '800', 
                    fontSize: '15px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 16px rgba(16, 137, 211, 0.2)',
                    transition: 'all 0.3s ease'
                  }}>
                    {currentPost ? 'Update' : 'Post Now'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Classroom Exams Modal */}
      {modals.classroomExamsModal && currentClassroom && (
        <div className={`modal-overlay active`} onClick={(e) => e.target === e.currentTarget && closeModal('classroomExamsModal')}>
          <div className="modal" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <h3>Exams in "{currentClassroom.classroomName}"</h3>
                <span className="modal-header-badge">Teacher: {currentClassroom.teacherName || selectedTeacher?.teacher?.name}</span>
              </div>
              <button className="modal-close" onClick={() => closeModal('classroomExamsModal')}>
                <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              {classroomExams.length > 0 ? (
                <div className="table-wrapper">
                  <table className="exams-table">
                    <thead>
                      <tr>
                        <th>Exam Name</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Created By</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classroomExams.map(exam => {
                        const d = new Date(exam.createdAt);
                        return (
                          <tr key={exam._id}>
                            <td className="fw-600">{exam.examName}</td>
                            <td>{d.toLocaleDateString()}</td>
                            <td>{d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</td>
                            <td>
                              <span className={`department-badge ${exam.examType === 'ai' ? 'ai-badge' : ''}`} style={{ background: exam.examType === 'ai' ? 'rgba(138, 43, 226, 0.1)' : 'rgba(16, 137, 211, 0.1)', color: exam.examType === 'ai' ? 'blueviolet' : 'var(--primary-blue)' }}>
                                {exam.examType === 'ai' ? 'AI Generated' : 'Manual'}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="action-btn-premium" 
                                onClick={() => viewExamSubmissions(exam)}
                                style={{
                                  background: 'rgba(16, 137, 211, 0.1)',
                                  color: 'var(--primary-blue)',
                                  padding: '8px 16px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(16, 137, 211, 0.2)',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                Students
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(16, 137, 211, 0.03)', borderRadius: '16px' }}>
                  <p style={{ margin: 0, color: 'var(--muted-text)' }}>No exams created in this classroom yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exam Submissions Modal */}
      {modals.examSubmissionsModal && selectedExam && (
        <div className={`modal-overlay active`} onClick={(e) => e.target === e.currentTarget && closeModal('examSubmissionsModal')}>
          <div className="modal" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <h3>Submissions for "{selectedExam.examName}"</h3>
                <span className="modal-header-badge">{examSubmissions.length} Submissions</span>
              </div>
              <button className="modal-close" onClick={() => closeModal('examSubmissionsModal')}>
                <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              {examSubmissions.length > 0 ? (
                <div className="table-wrapper">
                  <table className="exams-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Student ID</th>
                        <th>Marks</th>
                        <th>Time</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examSubmissions.map(sub => {
                        const d = new Date(sub.submittedAt);
                        return (
                          <tr key={sub._id}>
                            <td className="fw-600">{sub.studentName}</td>
                            <td>{sub.rollNumber}</td>
                            <td className="fw-700" style={{ color: 'var(--primary-blue)' }}>{sub.correctCount} / {sub.totalQuestions}</td>
                            <td>{d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</td>
                            <td>{d.toLocaleDateString()}</td>
                            <td>
                              <button 
                                className="action-btn-premium" 
                                onClick={() => viewAdminAnalytics(sub)}
                                style={{
                                  background: 'rgba(16, 137, 211, 0.1)',
                                  color: 'var(--primary-blue)',
                                  padding: '6px 14px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(16, 137, 211, 0.2)',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                View Result
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(16, 137, 211, 0.03)', borderRadius: '16px' }}>
                  <p style={{ margin: 0, color: 'var(--muted-text)' }}>No submissions yet for this exam.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Teacher Materials Modal */}
      {modals.teacherMaterialsModal && currentPost && (
        <div className={`modal-overlay active`} onClick={(e) => e.target === e.currentTarget && closeModal('teacherMaterialsModal')}>
          <div className="modal" style={{ maxWidth: '600px', borderRadius: '32px', border: '1px solid rgba(16, 137, 211, 0.1)', overflow: 'hidden' }}>
            <div className="modal-header" style={{ 
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
              padding: '28px 36px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div className="modal-header-left">
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>Teacher Materials</h3>
                <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>{currentPost.title}</p>
              </div>
              <button className="modal-close" onClick={() => closeModal('teacherMaterialsModal')} style={{ 
                background: 'white',
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#64748b"/></svg>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '36px', background: '#fcfdfe' }}>
              {currentPost.files && currentPost.files.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {currentPost.files.map((file, fIdx) => (
                    <div key={fIdx} style={{ 
                      padding: '20px', 
                      background: 'white', 
                      borderRadius: '20px', 
                      border: '1.5px solid #edf2f7', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '16px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        background: 'rgba(16, 137, 211, 0.06)', 
                        borderRadius: '16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '24px'
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-blue)' }}>
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', fontWeight: '600' }}>{file.size} • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}</div>
                      </div>
                      <a href={file.data} download={file.name} className="action-btn-premium" style={{ 
                        background: 'linear-gradient(135deg, var(--primary-blue), var(--secondary-blue))', 
                        color: 'white', 
                        padding: '10px 18px', 
                        borderRadius: '12px', 
                        fontSize: '12px', 
                        fontWeight: '800', 
                        textDecoration: 'none',
                        boxShadow: '0 4px 10px rgba(16, 137, 211, 0.2)',
                        transition: 'all 0.2s ease'
                      }}>
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '32px', border: '2px dashed #e2e8f0' }}>
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px' }}>
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M12 18V6"></path>
                    <path d="m8 10 4-4 4 4"></path>
                  </svg>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '16px', fontWeight: '600' }}>No materials uploaded by teacher</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student Exams Modal */}
      {modals.studentExamsModal && currentStudent && (
        <div className={`modal-overlay active`} onClick={(e) => e.target === e.currentTarget && closeModal('studentExamsModal')}>
          <div className="modal" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <h3>Exams History: {currentStudent.name}</h3>
                <span className="modal-header-badge">{studentCompletedExams.length} Exams Completed</span>
              </div>
              <button className="modal-close" onClick={() => closeModal('studentExamsModal')}>
                <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              {studentCompletedExams.length > 0 ? (
                <div className="table-wrapper">
                  <table className="exams-table">
                    <thead>
                      <tr>
                        <th>Exam Name</th>
                        <th>Subject</th>
                        <th>Marks</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentCompletedExams.map(sub => {
                        const d = new Date(sub.submittedAt);
                        return (
                          <tr key={sub._id}>
                            <td className="fw-600">{sub.examName || sub.examId?.examName || "Final Exam"}</td>
                            <td>
                              <span style={{ 
                                padding: '4px 10px', 
                                background: 'rgba(16, 137, 211, 0.05)', 
                                color: 'var(--primary-blue)', 
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}>
                                {sub.subject || sub.examId?.subject || "General"}
                              </span>
                            </td>
                            <td className="fw-700" style={{ color: 'var(--primary-blue)' }}>{sub.correctCount} / {sub.totalQuestions}</td>
                            <td>{d.toLocaleDateString()}</td>
                            <td>{d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</td>
                            <td>
                              <button 
                                className="action-btn-premium" 
                                onClick={() => viewAdminAnalytics(sub)}
                                style={{
                                  background: 'rgba(16, 137, 211, 0.1)',
                                  color: 'var(--primary-blue)',
                                  padding: '6px 14px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(16, 137, 211, 0.2)',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                View Result
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(16, 137, 211, 0.03)', borderRadius: '16px' }}>
                  <p style={{ margin: 0, color: 'var(--muted-text)' }}>No exams completed by this student yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exam Submissions Modal */}
      {modals.examSubmissionsModal && selectedExam && (
        <div className={`modal-overlay active`} onClick={(e) => e.target === e.currentTarget && closeModal('examSubmissionsModal')}>
          <div className="modal" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <h3>Students who submitted: {selectedExam.examName}</h3>
                <span className="modal-header-badge">{examSubmissions.length} Submissions</span>
              </div>
              <button className="modal-close" onClick={() => closeModal('examSubmissionsModal')}>
                <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              {examSubmissions.length > 0 ? (
                <div className="table-wrapper">
                  <table className="exams-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Student ID</th>
                        <th>Marks</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examSubmissions.map(sub => {
                        const d = new Date(sub.submittedAt);
                        return (
                          <tr key={sub._id}>
                            <td className="fw-600">{sub.studentName}</td>
                            <td>{sub.rollNumber}</td>
                            <td className="fw-700" style={{ color: 'var(--primary-blue)' }}>{sub.correctCount} / {sub.totalQuestions}</td>
                            <td>{d.toLocaleDateString()}</td>
                            <td>{d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</td>
                            <td>
                              <button 
                                className="action-btn-premium" 
                                onClick={() => viewAdminAnalytics(sub)}
                                style={{
                                  background: 'rgba(16, 137, 211, 0.1)',
                                  color: 'var(--primary-blue)',
                                  padding: '6px 14px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(16, 137, 211, 0.2)',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                View Result
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(16, 137, 211, 0.03)', borderRadius: '16px' }}>
                  <p style={{ margin: 0, color: 'var(--muted-text)' }}>No submissions yet for this exam.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Analytics Modal */}
      {modals.adminAnalyticsModal && selectedSubmission && (
        <div className={`modal-overlay active`} onClick={(e) => e.target === e.currentTarget && closeModal('adminAnalyticsModal')}>
          <div className="modal" style={{ maxWidth: '900px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <div className="modal-header-left">
                <h3>Performance Analytics</h3>
                <span className="modal-header-badge">{selectedSubmission.studentName}</span>
              </div>
              <button className="modal-close" onClick={() => closeModal('adminAnalyticsModal')}>
                <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '24px', overflowY: 'auto' }}>
              <AdminAnalyticsView submission={selectedSubmission} exam={selectedExamDetails} />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
    </>
  );
};

const AdminAnalyticsView = ({ submission, exam }) => {
  const total = submission.totalQuestions;
  const correctPercent = (submission.correctCount / total) * 100 || 0;
  
  const chartStyle = {
    background: `conic-gradient(#22c55e 0% ${correctPercent}%, #ef4444 ${correctPercent}% 100%)`,
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    margin: '0 auto',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  };

  return (
    <div className="admin-analytics-container">
      <div className="analytics-top-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 250px', gap: '20px', marginBottom: '25px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
          <div className="stat-card" style={{ padding: '20px', textAlign: 'center', background: 'rgba(16, 137, 211, 0.05)', borderRadius: '16px', border: '1px solid rgba(16, 137, 211, 0.1)' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', color: 'var(--muted-text)', textTransform: 'uppercase', letterSpacing: '1px' }}>TOTAL</p>
            <h3 style={{ margin: '8px 0', fontSize: '28px' }}>{submission.totalQuestions}</h3>
          </div>
          <div className="stat-card" style={{ padding: '20px', textAlign: 'center', background: 'rgba(34, 197, 94, 0.08)', borderRadius: '16px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '1px' }}>CORRECT</p>
            <h3 style={{ margin: '8px 0', fontSize: '28px', color: '#22c55e' }}>{submission.correctCount}</h3>
          </div>
          <div className="stat-card" style={{ padding: '20px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px' }}>WRONG</p>
            <h3 style={{ margin: '8px 0', fontSize: '28px', color: '#ef4444' }}>{submission.wrongCount}</h3>
          </div>
        </div>
        <div className="accuracy-chart-box" style={{ padding: '20px', background: 'white', borderRadius: '18px', border: '1px solid #efefef', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <p style={{ margin: '0 0 15px 0', fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Accuracy breakdown</p>
          <div style={chartStyle}></div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '15px', fontSize: '11px', fontWeight: '600' }}>
             <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 10, height: 10, background: '#22c55e', borderRadius: '50%' }}></span> {Math.round(correctPercent)}% Correct</span>
             <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 10, height: 10, background: '#ef4444', borderRadius: '50%' }}></span> {Math.round(100 - correctPercent)}% Wrong</span>
          </div>
        </div>
      </div>

      <div className="breakdown-header" style={{ marginBottom: '15px', borderBottom: '2px solid rgba(16, 137, 211, 0.08)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m17 5-5 5-5-5"/><path d="m17 14-5 5-5-5"/></svg>
         <h4 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Detailed Performance Breakdown</h4>
      </div>
      
      {!exam ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div className="status-dot"></div>
          <p style={{ color: 'var(--muted-text)', fontSize: '13px', marginTop: '10px' }}>Loading full questionnaire...</p>
        </div>
      ) : (
        <div className="admin-breakdown-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {submission.answers.map((ans, idx) => {
            const questionData = exam.questions.find(q => q._id === ans.questionId);
            return (
              <div key={idx} style={{ 
                padding: '20px', 
                borderRadius: '16px', 
                background: ans.isCorrect ? 'rgba(34, 197, 94, 0.02)' : 'rgba(239, 68, 68, 0.02)',
                border: `1.5px solid ${ans.isCorrect ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`,
                position: 'relative',
              }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: ans.isCorrect ? '#22c55e' : '#ef4444', borderRadius: '4px 0 0 4px' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Question {idx + 1}</h5>
                  <div style={{ 
                    padding: '4px 10px', 
                    borderRadius: '8px', 
                    fontSize: '11px', 
                    fontWeight: '800',
                    background: ans.isCorrect ? '#dcfce7' : '#fee2e2',
                    color: ans.isCorrect ? '#16a34a' : '#dc2626',
                  }}>
                    {ans.isCorrect ? 'CORRECT' : 'INCORRECT'}
                  </div>
                </div>

                <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '15px', lineHeight: '1.5' }}>
                  {questionData?.questionText || "Question text not found"}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                  {['a', 'b', 'c', 'd'].map(opt => {
                    const isSelected = ans.selectedOption === opt;
                    const isCorrect = questionData?.correctAnswer === opt;
                    
                    let bgColor = 'white';
                    let borderColor = '#e2e8f0';
                    let textColor = '#475569';

                    if (isSelected && isCorrect) {
                      bgColor = '#f0fdf4';
                      borderColor = '#22c55e';
                      textColor = '#16a34a';
                    } else if (isSelected && !isCorrect) {
                      bgColor = '#fef2f2';
                      borderColor = '#ef4444';
                      textColor = '#dc2626';
                    } else if (!isSelected && isCorrect) {
                      bgColor = '#f0fdf4';
                      borderColor = '#22c55e';
                      textColor = '#16a34a';
                    }

                    return (
                      <div key={opt} style={{ 
                        padding: '12px 15px', 
                        borderRadius: '12px', 
                        background: bgColor, 
                        border: `1.5px solid ${borderColor}`,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: textColor,
                        fontWeight: (isSelected || isCorrect) ? '700' : '500',
                        boxShadow: (isSelected || isCorrect) ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                      }}>
                        <span style={{ 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: '8px', 
                          backgroundColor: isSelected 
                            ? (isCorrect ? '#22c55e' : '#ef4444') 
                            : (isCorrect ? '#22c55e' : '#f1f5f9'), 
                          color: (isSelected || isCorrect) ? 'white' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '900',
                          border: 'none',
                          boxShadow: (isSelected || isCorrect) ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                        }}>
                          {opt.toUpperCase()}
                        </span>
                        <span style={{flex: 1}}>{questionData?.options[opt]}</span>
                        {isCorrect && (
                          <div style={{ background: '#22c55e', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
