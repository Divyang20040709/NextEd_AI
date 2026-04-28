const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../model/Admin');
const { verifyAdmin } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// ==================== ADMIN AUTH ROUTES ====================

// Admin Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, mobileNumber, email, password, institutionName, designation, department } = req.body;

    if (!name || !mobileNumber || !email || !password || !institutionName || !designation || !department) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      name,
      mobileNumber,
      email: email.toLowerCase(),
      password: hashedPassword,
      institutionName,
      designation,
      department
    });

    await newAdmin.save();

    const adminData = newAdmin.toObject();
    delete adminData.password;

    const token = jwt.sign(
      { id: newAdmin._id, email: newAdmin.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Admin registered successfully',
      admin: adminData,
      token
    });
  } catch (err) {
    console.error('Admin signup error:', err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const adminData = admin.toObject();
    delete adminData.password;

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      admin: adminData,
      token
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Delete Admin Account
router.delete('/delete-account/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const deletedAdmin = await Admin.findOneAndDelete({ email: email.toLowerCase() });

    if (!deletedAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({ message: 'Admin account deleted successfully' });
  } catch (err) {
    console.error('Delete admin account error:', err);
    res.status(500).json({ message: 'Server error during account deletion' });
  }
});

// ==================== TEACHER MANAGEMENT ROUTES ====================

// Get teacher statistics
router.get('/teacher-stats', adminController.getTeacherStats);

// Get all pending teacher requests
router.get('/teacher-requests', adminController.getTeacherRequests);

// Get all approved teachers
router.get('/all-teachers', adminController.getAllTeachers);

// Get all banned teachers
router.get('/banned-teachers', adminController.getBannedTeachers);

// Get full teacher profile
router.get('/teacher/:teacherId', adminController.getTeacherProfile);

// Approve teacher
router.patch('/approve-teacher/:teacherId', adminController.approveTeacher);

// Reject teacher
router.patch('/reject-teacher/:teacherId', adminController.rejectTeacher);

// Ban teacher
router.patch('/ban-teacher/:teacherId', adminController.banTeacher);

// Unban teacher
router.patch('/unban-teacher/:teacherId', adminController.unbanTeacher);

// Delete teacher
router.delete('/delete-teacher/:teacherId', adminController.deleteTeacher);

// ==================== STUDENT MANAGEMENT ROUTES ====================

// Get all students
router.get('/all-students', adminController.getAllStudents);

// Get student statistics
router.get('/student-stats', adminController.getStudentStats);

// Get banned students
router.get('/banned-students', adminController.getBannedStudents);

// Get student requests (for UI consistency)
router.get('/student-requests', adminController.getStudentRequests);

// Approve student
router.patch('/approve-student/:studentId', adminController.approveStudent);

// Reject student
router.patch('/reject-student/:studentId', adminController.rejectStudent);

// Get full student profile
router.get('/student/:studentId', adminController.getStudentProfile);

// Ban student
router.patch('/ban-student/:studentId', adminController.banStudent);

// Unban student
router.patch('/unban-student/:studentId', adminController.unbanStudent);

// Delete student
router.delete('/delete-student/:studentId', adminController.deleteStudent);

// ==================== CLASSROOM & POST MANAGEMENT ROUTES (ADMIN) ====================

// Delete classroom
router.delete('/classroom/:classroomId', adminController.deleteClassroomAsAdmin);

// Get classroom posts
router.get('/classroom/:classroomId/posts', adminController.getClassroomPostsAsAdmin);

// Get classroom students
router.get('/classroom/:classroomId/students', adminController.getClassroomStudents);

// Create post
router.post('/classroom/:classroomId/post', adminController.createPostAsAdmin);

// Update post
router.put('/post/:postId', adminController.updatePostAsAdmin);

// Delete post
router.delete('/post/:postId', adminController.deletePostAsAdmin);

// Get all global posts
router.get('/all-posts', adminController.getAllGlobalPosts);

// Get all global exams
router.get('/all-exams', adminController.getAllGlobalExams);

module.exports = router;
