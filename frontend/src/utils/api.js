import axios from 'axios';

// Base API URL - adjust if your backend runs on a different port
const API_BASE_URL = '/api';

/**
 * Notifies all components that auth state has changed.
 * Dispatches BOTH:
 *  - 'storage' event  → for cross-tab listeners
 *  - 'authStateChanged' event → for same-tab listeners (storage event doesn't fire in same tab)
 */
export const notifyAuthChange = () => {
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('authStateChanged'));
};


console.log('🔧 API Base URL:', API_BASE_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for professional token injection
api.interceptors.request.use(
  (config) => {
    // Check for any of the active tokens
    const token = localStorage.getItem('admin_token') || 
                  localStorage.getItem('student_token') || 
                  localStorage.getItem('teacher_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API methods
export const authAPI = {
  // Student Signup
  signupStudent: async (studentData) => {
    console.log('📤 Calling API: POST /auth/signup/student');
    console.log('📦 Request data:', studentData);
    
    try {
      const response = await api.post('/auth/signup/student', studentData);
      console.log('✅ Signup successful:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Signup failed:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Signup failed. Please try again.' 
      };
    }
  },

  // Teacher Signup
  signupTeacher: async (teacherData) => {
    console.log('📤 Calling API: POST /auth/signup/teacher');
    console.log('📦 Request data:', teacherData);
    
    try {
      const response = await api.post('/auth/signup/teacher', teacherData);
      console.log('✅ Signup successful:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Signup failed:', error);
      console.error('Error response:', error.response?.data);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Signup failed. Please try again.' 
      };
    }
  },

  // Student Login
  loginStudent: async (credentials) => {
    console.log('📤 Calling API: POST /auth/login/student');
    console.log('📦 Request data:', { email: credentials.email, password: '***' });
    
    try {
      const response = await api.post('/auth/login/student', credentials);
      console.log('✅ Login successful:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Login failed:', error);
      console.error('Error response:', error.response?.data);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please try again.' 
      };
    }
  },

  // Teacher Login
  loginTeacher: async (credentials) => {
    console.log('📤 Calling API: POST /auth/login/teacher');
    console.log('📦 Request data:', { email: credentials.email, password: '***' });
    
    try {
      const response = await api.post('/auth/login/teacher', credentials);
      console.log('✅ Login successful:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Login failed:', error);
      console.error('Error response:', error.response?.data);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please try again.',
        status: error.response?.data?.status,
        rejectedReason: error.response?.data?.rejectedReason
      };
    }
  },

  // Logout
  logout: async (email, role) => {
    console.log('📤 Calling API: POST /auth/logout');
    
    try {
      const response = await api.post('/auth/logout', { email, role });
      console.log('✅ Logout successful');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Logout failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Logout failed.' 
      };
    }
  },

  // Delete Account
  deleteAccount: async (email, role) => {
    console.log('📤 Calling API: DELETE /auth/delete-account');
    console.log('📦 Request data:', { email, role });
    
    try {
      const response = await api.delete('/auth/delete-account', { 
        data: { email, role } 
      });
      console.log('✅ Account deleted successfully');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Account deletion failed:', error);
      console.error('Error response:', error.response?.data);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Account deletion failed.' 
      };
    }
  }
};

// Chat API methods
export const chatAPI = {
  sendMessage: async (messages) => {
    console.log('📤 Calling API: POST /chat');
    try {
      const response = await api.post('/chat', { messages });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Chat API failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.details || 'AI failed to respond.' 
      };
    }
  }
};

// Classroom API methods
export const classroomAPI = {
  // Create classroom (Teacher)
  createClassroom: async (classroomData) => {
    console.log('📤 Calling API: POST /classroom/create');
    try {
      const response = await api.post('/classroom/create', classroomData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Create classroom failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to create classroom' 
      };
    }
  },

  // Get teacher's classrooms
  getTeacherClassrooms: async (teacherEmail) => {
    console.log('📤 Calling API: GET /classroom/teacher/:teacherEmail');
    try {
      const response = await api.get(`/classroom/teacher/${teacherEmail}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get teacher classrooms failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch classrooms' 
      };
    }
  },

  // Get single classroom by ID
  getClassroom: async (id) => {
    console.log('📤 Calling API: GET /classroom/:id');
    try {
      const response = await api.get(`/classroom/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get classroom failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch classroom' 
      };
    }
  },

  // Delete classroom (Teacher)
  deleteClassroom: async (id, teacherEmail) => {
    console.log('📤 Calling API: DELETE /classroom/:id');
    try {
      const response = await api.delete(`/classroom/${id}`, {
        data: { teacherEmail }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Delete classroom failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to delete classroom' 
      };
    }
  },

  // Join classroom (Student)
  joinClassroom: async (code, studentEmail, studentName, studentId) => {
    console.log('📤 Calling API: POST /classroom/join');
    try {
      const response = await api.post('/classroom/join', {
        code,
        studentEmail,
        studentName,
        studentId
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Join classroom failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to join classroom' 
      };
    }
  },

  // Leave classroom (Student)
  leaveClassroom: async (classroomId, studentEmail) => {
    console.log('📤 Calling API: POST /classroom/leave');
    try {
      const response = await api.post('/classroom/leave', {
        classroomId,
        studentEmail
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Leave classroom failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to leave classroom' 
      };
    }
  },

  // Get student's enrolled classrooms
  getStudentClassrooms: async (studentEmail) => {
    console.log('📤 Calling API: GET /classroom/student/:studentEmail');
    try {
      const response = await api.get(`/classroom/student/${studentEmail}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get student classrooms failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch classrooms' 
      };
    }
  }
};

// Post API methods
export const postAPI = {
  // Create post (Teacher)
  createPost: async (postData) => {
    console.log('📤 Calling API: POST /post/create');
    try {
      const response = await api.post('/post/create', postData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Create post failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to create post' 
      };
    }
  },

  // Get all posts for a classroom
  getClassroomPosts: async (classroomId) => {
    console.log('📤 Calling API: GET /post/classroom/:classroomId');
    try {
      const response = await api.get(`/post/classroom/${classroomId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get posts failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch posts' 
      };
    }
  },

  // Update post (Teacher)
  updatePost: async (id, postData) => {
    console.log('📤 Calling API: PUT /post/:id');
    try {
      const response = await api.put(`/post/${id}`, postData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Update post failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update post' 
      };
    }
  },

  // Soft delete post (Teacher)
  deletePost: async (id, deletedBy) => {
    console.log('📤 Calling API: DELETE /post/:id');
    try {
      const response = await api.delete(`/post/${id}`, {
        data: { deletedBy }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Delete post failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to delete post' 
      };
    }
  },

  // Submit to post (Student)
  submitToPost: async (submissionData) => {
    console.log('📤 Calling API: POST /submission/submit');
    try {
      const response = await api.post('/submission/submit', submissionData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Submission failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to submit' 
      };
    }
  },

  // Get submissions for a post (Teacher)
  getPostSubmissions: async (postId) => {
    console.log(`📤 Calling API: GET /submission/post/${postId}`);
    try {
      const response = await api.get(`/submission/post/${postId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get submissions failed:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to fetch submissions' };
    }
  },

  // Get a specific student's submission for a post (Student)
  getStudentSubmission: async (postId, studentId) => {
    console.log(`📤 Calling API: GET /submission/post/${postId}/student/${studentId}`);
    try {
      const response = await api.get(`/submission/post/${postId}/student/${studentId}`);
      return { success: true, data: response.data };
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('❌ Get student submission failed:', error);
      }
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch submission' 
      };
    }
  }
};

// Admin API methods
export const adminAPI = {
  // Get teacher statistics
  getTeacherStats: async () => {
    console.log('📤 Calling API: GET /admin/teacher-stats');
    try {
      const response = await api.get('/admin/teacher-stats');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get teacher stats failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch teacher statistics' 
      };
    }
  },

  // Get pending teacher requests
  getTeacherRequests: async () => {
    console.log('📤 Calling API: GET /admin/teacher-requests');
    try {
      const response = await api.get('/admin/teacher-requests');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get teacher requests failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch teacher requests' 
      };
    }
  },

  // Get all approved teachers
  getAllTeachers: async () => {
    console.log('📤 Calling API: GET /admin/all-teachers');
    try {
      const response = await api.get('/admin/all-teachers');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get all teachers failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch teachers' 
      };
    }
  },

  // Get all banned teachers
  getBannedTeachers: async () => {
    console.log('📤 Calling API: GET /admin/banned-teachers');
    try {
      const response = await api.get('/admin/banned-teachers');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get banned teachers failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch banned teachers' 
      };
    }
  },

  // Get teacher profile
  getTeacherProfile: async (teacherId) => {
    console.log('📤 Calling API: GET /admin/teacher/:teacherId');
    try {
      const response = await api.get(`/admin/teacher/${teacherId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get teacher profile failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch teacher profile' 
      };
    }
  },

  // Approve teacher
  approveTeacher: async (teacherId, approvalMessage) => {
    console.log('📤 Calling API: PATCH /admin/approve-teacher/:teacherId');
    try {
      const response = await api.patch(`/admin/approve-teacher/${teacherId}`, {
        approvalMessage
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Approve teacher failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to approve teacher' 
      };
    }
  },

  // Reject teacher
  rejectTeacher: async (teacherId, rejectedReason) => {
    console.log('📤 Calling API: PATCH /admin/reject-teacher/:teacherId');
    try {
      const response = await api.patch(`/admin/reject-teacher/${teacherId}`, {
        rejectedReason
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Reject teacher failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to reject teacher' 
      };
    }
  },

  // Ban teacher
  banTeacher: async (teacherId) => {
    console.log('📤 Calling API: PATCH /admin/ban-teacher/:teacherId');
    try {
      const response = await api.patch(`/admin/ban-teacher/${teacherId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Ban teacher failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to ban teacher' 
      };
    }
  },

  // Unban teacher
  unbanTeacher: async (teacherId) => {
    console.log('📤 Calling API: PATCH /admin/unban-teacher/:teacherId');
    try {
      const response = await api.patch(`/admin/unban-teacher/${teacherId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Unban teacher failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to unban teacher' 
      };
    }
  },

  deleteTeacher: async (teacherId) => {
    console.log('📤 Calling API: DELETE /admin/delete-teacher/:teacherId');
    try {
      const response = await api.delete(`/admin/delete-teacher/${teacherId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Delete teacher failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to delete teacher' 
      };
    }
  },

  // Student Management
  getAllStudents: async () => {
    console.log('📤 Calling API: GET /admin/all-students');
    try {
      const response = await api.get('/admin/all-students');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get all students failed:', error);
      return { success: false, message: 'Failed to fetch students' };
    }
  },

  getStudentStats: async () => {
    console.log('📤 Calling API: GET /admin/student-stats');
    try {
      const response = await api.get('/admin/student-stats');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get student stats failed:', error);
      return { success: false, message: 'Failed to fetch student stats' };
    }
  },

  getBannedStudents: async () => {
    console.log('📤 Calling API: GET /admin/banned-students');
    try {
      const response = await api.get('/admin/banned-students');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get banned students failed:', error);
      return { success: false, message: 'Failed to fetch banned students' };
    }
  },

  getStudentRequests: async () => {
    console.log('📤 Calling API: GET /admin/student-requests');
    try {
      const response = await api.get('/admin/student-requests');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get student requests failed:', error);
      return { success: false, message: 'Failed to fetch student requests' };
    }
  },

  getStudentProfile: async (studentId) => {
    console.log('📤 Calling API: GET /admin/student/:studentId');
    try {
      const response = await api.get(`/admin/student/${studentId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get student profile failed:', error);
      return { success: false, message: 'Failed to fetch student profile' };
    }
  },

  approveStudent: async (studentId, approvalMessage) => {
    console.log('📤 Calling API: PATCH /admin/approve-student/:studentId');
    try {
      const response = await api.patch(`/admin/approve-student/${studentId}`, { approvalMessage });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Approve student failed:', error);
      return { success: false, message: 'Failed to approve student' };
    }
  },

  rejectStudent: async (studentId, rejectedReason) => {
    console.log('📤 Calling API: PATCH /admin/reject-student/:studentId');
    try {
      const response = await api.patch(`/admin/reject-student/${studentId}`, { rejectedReason });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Reject student failed:', error);
      return { success: false, message: 'Failed to reject student' };
    }
  },

  banStudent: async (studentId) => {
    console.log('📤 Calling API: PATCH /admin/ban-student/:studentId');
    try {
      const response = await api.patch(`/admin/ban-student/${studentId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Ban student failed:', error);
      return { success: false, message: 'Failed to ban student' };
    }
  },

  unbanStudent: async (studentId) => {
    console.log('📤 Calling API: PATCH /admin/unban-student/:studentId');
    try {
      const response = await api.patch(`/admin/unban-student/${studentId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Unban student failed:', error);
      return { success: false, message: 'Failed to unban student' };
    }
  },

  deleteStudent: async (studentId) => {
    console.log('📤 Calling API: DELETE /admin/delete-student/:studentId');
    try {
      const response = await api.delete(`/admin/delete-student/${studentId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Delete student failed:', error);
      return { success: false, message: 'Failed to delete student' };
    }
  },

  // Classroom & Post Management (Admin)
  deleteClassroom: async (classroomId) => {
    console.log('📤 Calling API: DELETE /admin/classroom/:classroomId');
    try {
      const response = await api.delete(`/admin/classroom/${classroomId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Delete classroom failed:', error);
      return { success: false, message: 'Failed to delete classroom' };
    }
  },

  getClassroomPosts: async (classroomId) => {
    console.log('📤 Calling API: GET /admin/classroom/:classroomId/posts');
    try {
      const response = await api.get(`/admin/classroom/${classroomId}/posts`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get classroom posts failed:', error);
      return { success: false, message: 'Failed to fetch posts' };
    }
  },

  adminCreatePost: async (classroomId, postData) => {
    console.log('📤 Calling API: POST /admin/classroom/:classroomId/post');
    try {
      const response = await api.post(`/admin/classroom/${classroomId}/post`, postData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Create post failed:', error);
      return { success: false, message: 'Failed to create post' };
    }
  },

  adminUpdatePost: async (postId, postData) => {
    console.log('📤 Calling API: PUT /admin/post/:postId');
    try {
      const response = await api.put(`/admin/post/${postId}`, postData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Update post failed:', error);
      return { success: false, message: 'Failed to update post' };
    }
  },

  adminDeletePost: async (postId, adminEmail) => {
    console.log('📤 Calling API: DELETE /admin/post/:postId');
    try {
      const response = await api.delete(`/admin/post/${postId}`, {
        data: { adminEmail }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Delete post failed:', error);
      return { success: false, message: 'Failed to delete post' };
    }
  },

  getClassroomStudents: async (classroomId) => {
    console.log('📤 Calling API: GET /admin/classroom/:classroomId/students');
    try {
      const response = await api.get(`/admin/classroom/${classroomId}/students`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get classroom students failed:', error);
      return { success: false, message: 'Failed to fetch classroom students' };
    }
  },

  getAllGlobalPosts: async () => {
    console.log('📤 Calling API: GET /admin/all-posts');
    try {
      const response = await api.get('/admin/all-posts');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get all global posts failed:', error);
      return { success: false, message: 'Failed to fetch global posts' };
    }
  },

  getAllGlobalExams: async () => {
    console.log('📤 Calling API: GET /admin/all-exams');
    try {
      const response = await api.get('/admin/all-exams');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get all global exams failed:', error);
      return { success: false, message: 'Failed to fetch global exams' };
    }
  }
};

// Exam API methods
export const examAPI = {
  createExam: async (examData) => {
    console.log('📤 Calling API: POST /exams/create');
    try {
      const response = await api.post('/exams/create', examData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Create exam failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to create exam' 
      };
    }
  },

  getClassroomExams: async (classroomId) => {
    console.log(`📤 Calling API: GET /exams/classroom/${classroomId}`);
    try {
      const response = await api.get(`/exams/classroom/${classroomId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get exams failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch exams' 
      };
    }
  },

  getExam: async (examId) => {
    console.log(`📤 Calling API: GET /exams/${examId}`);
    try {
      const response = await api.get(`/exams/${examId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get exam failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch exam details' 
      };
    }
  },


  deleteExam: async (examId) => {
    console.log(`📤 Calling API: DELETE /exams/${examId}`);
    try {
      const response = await api.delete(`/exams/${examId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Delete exam failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to delete exam' 
      };
    }
  },

  getExamSubmissions: async (examId) => {
    console.log(`📤 Calling API: GET /exams/${examId}/submissions`);
    try {
      const response = await api.get(`/exams/${examId}/submissions`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get exam submissions failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch submissions' 
      };
    }
  },

  submitExam: async (examData) => {
    console.log(`📤 Calling API: POST /exams/submit`);
    try {
      const response = await api.post('/exams/submit', examData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Submit exam failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to submit exam' 
      };
    }
  },

  getStudentSubmissions: async (studentEmail) => {
    console.log(`📤 Calling API: GET /exams/student-submissions/${studentEmail}`);
    try {
      const response = await api.get(`/exams/student-submissions/${studentEmail}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Get student submissions failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch student submissions' 
      };
    }
  }
};

export default api;

