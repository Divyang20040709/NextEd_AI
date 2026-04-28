const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const TeacherSignup = require('../model/TeacherSignup');
const StudentSignup = require('../model/StudentSignup');

// ==================== STUDENT SIGNUP ====================
const studentSignup = async (req, res) => {
  try {
    const { name, mobileNumber, email, password, institutionName, studentId, programName, courseDepartment, year } = req.body;

    if (!name || !mobileNumber || !email || !password || !institutionName || !studentId || !programName || !courseDepartment || !year) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Check if email already exists in either collection
    const existingStudent = await StudentSignup.findOne({ email: email.toLowerCase() });
    const existingTeacher = await TeacherSignup.findOne({ email: email.toLowerCase() });

    if (existingStudent) {
      return res.status(400).json({ message: 'This email is already registered as a student' });
    }

    if (existingTeacher) {
      return res.status(400).json({ message: 'This email is already registered as a teacher' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = new StudentSignup({
      name,
      mobileNumber,
      email: email.toLowerCase(),
      password: hashedPassword,
      institutionName,
      studentId,
      programName,
      courseDepartment,
      year,
      status: 'pending', // Default status for new students (same as teachers)
      createdAt: new Date()
    });

    await newStudent.save();

    const studentData = newStudent.toObject();
    delete studentData.password;

    // Emit socket event to admins
    const io = req.app.get('socketio');
    if (io) {
      io.emit('admin-new-student-request', {
        message: 'New student registration request',
        data: studentData
      });
    }

    const token = jwt.sign(
      { id: newStudent._id, email: newStudent.email, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Student signup successful. Your account is pending admin approval.'
    });
  } catch (err) {
    console.error('Student signup error:', err);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

// ==================== TEACHER SIGNUP ====================
const teacherSignup = async (req, res) => {
  try {
    const { name, mobileNumber, email, password, institutionName, designation, department, subject } = req.body;

    if (!name || !mobileNumber || !email || !password || !institutionName || !designation || !department || !subject) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Check if email already exists in either collection
    const existingTeacher = await TeacherSignup.findOne({ email: email.toLowerCase() });
    const existingStudent = await StudentSignup.findOne({ email: email.toLowerCase() });

    if (existingTeacher) {
      return res.status(400).json({ message: 'This email is already registered as a teacher' });
    }

    if (existingStudent) {
      return res.status(400).json({ message: 'This email is already registered as a student' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newTeacher = new TeacherSignup({
      name,
      mobileNumber,
      email: email.toLowerCase(),
      password: hashedPassword,
      institutionName,
      designation,
      department,
      subject,
      status: 'pending', // Default status for new teachers
      createdAt: new Date()
    });


    await newTeacher.save();

    const teacherData = newTeacher.toObject();
    delete teacherData.password;

    // Emit socket event to admins
    const io = req.app.get('socketio');
    if (io) {
      io.emit('admin-new-teacher-request', {
        message: 'New teacher registration request',
        data: teacherData
      });
    }

    const token = jwt.sign(
      { id: newTeacher._id, email: newTeacher.email, role: 'teacher' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Teacher signup successful. Your account is pending admin approval.'
    });
  } catch (err) {
    console.error('Teacher signup error:', err);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

// ==================== TEACHER LOGIN ====================
const teacherLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const teacher = await TeacherSignup.findOne({ email: email.toLowerCase() });
    if (!teacher) {
      return res.status(404).json({ message: 'Your account was not found. It may have been rejected or deleted.', status: 'not_found' });
    }

    // Check teacher status
    if (teacher.status === 'pending') {
      return res.status(403).json({ 
        message: '⏳ Your account is pending approval. Please wait for admin approval.' 
      });
    }

    if (teacher.status === 'rejected') {
      return res.status(403).json({ 
        message: `❌ Your account was rejected. Reason: ${teacher.rejectedReason || 'Not specified'}` 
      });
    }

    if (teacher.isBanned || teacher.status === 'banned') {
      return res.status(403).json({ 
        status: 'banned',
        message: 'You can\'t login because admin banned you. Ask admin to unban.' 
      });
    }

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const teacherData = teacher.toObject();
    delete teacherData.password;

    const token = jwt.sign(
      { id: teacher._id, email: teacher.email, role: 'teacher' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Include approval message if available
    const responseData = {
      message: teacher.approvalMessage || 'Login successful',
      teacher: teacherData,
      token
    };

    res.json(responseData);
  } catch (err) {
    console.error('Teacher login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ==================== STUDENT LOGIN ====================
const studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const student = await StudentSignup.findOne({ email: email.toLowerCase() });
    if (!student) {
      return res.status(404).json({ message: 'Your account was not found. It may have been rejected or deleted.', status: 'not_found' });
    }

    // Check student status
    if (student.status === 'pending') {
      return res.status(403).json({ 
        message: '⏳ Your account is pending approval. Please wait for admin approval.' 
      });
    }

    if (student.status === 'rejected') {
      return res.status(403).json({ 
        message: `❌ Your account was rejected by admin. ${student.rejectedReason ? 'Reason: ' + student.rejectedReason : ''}` 
      });
    }

    // Check if student is banned
    if (student.isBanned || student.status === 'banned') {
      return res.status(403).json({ 
        success: false,
        status: 'banned',
        message: 'You can\'t login because admin banned you. Ask admin to unban.' 
      });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const studentData = student.toObject();
    delete studentData.password;

    const token = jwt.sign(
      { id: student._id, email: student.email, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Check if newly approved (for red dot notification)
    const responseData = {
      message: 'Login successful',
      student: studentData,
      token
    };

    // If approved within last 7 days, show notification
    if (student.approvedAt) {
      const daysSinceApproval = (Date.now() - new Date(student.approvedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceApproval <= 7) {
        responseData.newlyApproved = true;
      }
    }

    res.json(responseData);
  } catch (err) {
    console.error('Student login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ==================== VALIDATE TEACHER STATUS ====================
const validateTeacher = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const teacher = await TeacherSignup.findOne({ email: email.toLowerCase() });
    
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher account not found. Please sign up again.' });
    }

    if (teacher.isBanned || teacher.status === 'banned') {
      return res.status(403).json({ success: false, message: '🚫 Your account has been banned by admin.' });
    }

    if (teacher.status === 'rejected') {
      return res.status(403).json({ success: false, message: `❌ Your account was rejected. Reason: ${teacher.rejectedReason}` });
    }

    if (teacher.status === 'pending') {
      return res.status(403).json({ success: false, message: '⏳ Your account is still pending approval.' });
    }

    if (teacher.status === 'approved') {
      return res.json({ success: true, message: 'Teacher is valid', teacher: { email: teacher.email, name: teacher.name } });
    }

    return res.status(400).json({ success: false, message: 'Invalid teacher status' });
  } catch (err) {
    console.error('Validate teacher error:', err);
    res.status(500).json({ success: false, message: 'Server error during validation' });
  }
};

// ==================== LOGOUT ====================
const logout = async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Server error during logout' });
  }
};

// ==================== DELETE ACCOUNT ====================
const deleteAccount = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ success: false, message: 'Email and role are required' });
    }

    let deletedAccount;
    if (role === 'teacher') {
      deletedAccount = await TeacherSignup.findOneAndDelete({ email: email.toLowerCase() });
    } else if (role === 'student') {
      deletedAccount = await StudentSignup.findOneAndDelete({ email: email.toLowerCase() });
    }

    if (!deletedAccount) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ success: false, message: 'Server error during account deletion' });
  }
};

module.exports = {
  studentSignup,
  teacherSignup,
  teacherLogin,
  studentLogin,
  validateTeacher,
  logout,
  deleteAccount
};
