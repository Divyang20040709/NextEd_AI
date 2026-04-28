const express = require('express');
const router = express.Router();
const Classroom = require('../model/Classroom');
const Post = require('../model/Post');
const StudentSignup = require('../model/StudentSignup');

// ==================== CLASSROOM ROUTES ====================


// Create Classroom (Teacher)
router.post('/create', async (req, res) => {
  console.log('📝 Create Classroom Request');
  console.log('Request body:', req.body);
  
  try {
    const { subject, classGrade, division, teacherEmail, teacherName } = req.body;
    
    // Validation
    if (!subject || !classGrade || !division || !teacherEmail || !teacherName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Generate unique classroom code
    let code;
    let isUnique = false;
    
    while (!isUnique) {
      code = Classroom.generateClassroomCode();
      const existing = await Classroom.findOne({ code });
      if (!existing) isUnique = true;
    }

    // Create classroom
    const newClassroom = new Classroom({
      subject,
      classGrade,
      division,
      teacherEmail: teacherEmail.toLowerCase(),
      teacherName,
      code,
      students: []
    });

    await newClassroom.save();
    console.log('✅ Classroom created:', code);

    res.status(201).json({ 
      message: 'Classroom created successfully',
      classroom: newClassroom
    });
  } catch (err) {
    console.error('❌ Create classroom error:', err);
    res.status(500).json({ message: 'Server error during classroom creation' });
  }
});

// Get Teacher's Classrooms
router.get('/teacher/:teacherEmail', async (req, res) => {
  console.log('📚 Get Teacher Classrooms Request');
  
  try {
    const { teacherEmail } = req.params;
    
    // Get classrooms lean so we can modify the structure
    const classrooms = await Classroom.find({ 
      teacherEmail: teacherEmail.toLowerCase() 
    }).sort({ createdAt: -1 }).lean();

    // 1. Collect all unique student emails across all classrooms
    const allEmails = new Set();
    classrooms.forEach(room => {
      if (room.students) {
        room.students.forEach(s => allEmails.add(s.email.toLowerCase()));
      }
    });

    // 2. Bulk fetch studentIds for these emails
    const studentsMap = {};
    if (allEmails.size > 0) {
      const studentProfiles = await StudentSignup.find({ 
        email: { $in: Array.from(allEmails) } 
      }, 'email studentId').lean();
      
      studentProfiles.forEach(profile => {
        studentsMap[profile.email.toLowerCase()] = profile.studentId;
      });
    }

    // 3. Inject studentId where missing or N/A
    classrooms.forEach(room => {
      if (room.students) {
        room.students.forEach(s => {
          if (!s.studentId || s.studentId === 'N/A') {
            s.studentId = studentsMap[s.email.toLowerCase()] || 'N/A';
          }
        });
      }
    });

    console.log(`✅ Found and enriched ${classrooms.length} classrooms for ${teacherEmail}`);
    res.json({ classrooms });
  } catch (err) {
    console.error('❌ Get teacher classrooms error:', err);
    res.status(500).json({ message: 'Server error fetching classrooms' });
  }
});


// Get Single Classroom by ID
router.get('/:id', async (req, res) => {
  console.log('🔍 Get Classroom by ID Request');
  
  try {
    const { id } = req.params;
    
    const classroom = await Classroom.findById(id);
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    console.log('✅ Classroom found:', classroom.code);

    res.json({ classroom });
  } catch (err) {
    console.error('❌ Get classroom error:', err);
    res.status(500).json({ message: 'Server error fetching classroom' });
  }
});

// Delete Classroom (Teacher)
router.delete('/:id', async (req, res) => {
  console.log('🗑️ Delete Classroom Request');
  
  try {
    const { id } = req.params;
    const { teacherEmail } = req.body;
    
    // Find classroom
    const classroom = await Classroom.findById(id);
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Verify ownership
    if (classroom.teacherEmail !== teacherEmail.toLowerCase()) {
      return res.status(403).json({ message: 'Unauthorized: You do not own this classroom' });
    }

    // Delete all posts associated with this classroom
    await Post.deleteMany({ classroomId: id });
    
    // Delete classroom
    await Classroom.findByIdAndDelete(id);
    
    console.log('✅ Classroom and posts deleted:', classroom.code);

    res.json({ message: 'Classroom deleted successfully' });
  } catch (err) {
    console.error('❌ Delete classroom error:', err);
    res.status(500).json({ message: 'Server error deleting classroom' });
  }
});

// Join Classroom (Student)
router.post('/join', async (req, res) => {
  console.log('🎓 Join Classroom Request');
  console.log('Request body:', req.body);
  
  try {
    const { code, studentEmail, studentName, studentId } = req.body;
    
    // Validation
    if (!code || !studentEmail || !studentName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Find classroom by code
    const classroom = await Classroom.findOne({ code });
    
    if (!classroom) {
      return res.status(404).json({ message: 'Invalid classroom code' });
    }

    // Check if student already enrolled
    const isEnrolled = classroom.students.some(
      student => student.email === studentEmail.toLowerCase()
    );

    if (isEnrolled) {
      return res.status(400).json({ message: 'You are already enrolled in this classroom' });
    }

    // Add student to classroom
    classroom.students.push({
      email: studentEmail.toLowerCase(),
      name: studentName,
      studentId: studentId || 'N/A',
      joinedAt: new Date()
    });


    await classroom.save();
    console.log('✅ Student enrolled:', studentEmail);

    res.json({ 
      message: 'Successfully joined classroom',
      classroom
    });
  } catch (err) {
    console.error('❌ Join classroom error:', err);
    res.status(500).json({ message: 'Server error joining classroom' });
  }
});

// Leave Classroom (Student)
router.post('/leave', async (req, res) => {
  console.log('👋 Leave Classroom Request');
  
  try {
    const { classroomId, studentEmail } = req.body;
    
    // Validation
    if (!classroomId || !studentEmail) {
      return res.status(400).json({ message: 'Classroom ID and student email are required' });
    }

    // Find classroom
    const classroom = await Classroom.findById(classroomId);
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Remove student from classroom
    classroom.students = classroom.students.filter(
      student => student.email !== studentEmail.toLowerCase()
    );

    await classroom.save();
    console.log('✅ Student left classroom:', studentEmail);

    res.json({ message: 'Successfully left classroom' });
  } catch (err) {
    console.error('❌ Leave classroom error:', err);
    res.status(500).json({ message: 'Server error leaving classroom' });
  }
});

// Get Student's Enrolled Classrooms
router.get('/student/:studentEmail', async (req, res) => {
  console.log('🎒 Get Student Classrooms Request');
  
  try {
    const { studentEmail } = req.params;
    
    // Find all classrooms where student is enrolled
    const classrooms = await Classroom.find({
      'students.email': studentEmail.toLowerCase()
    }).sort({ createdAt: -1 });

    console.log(`✅ Found ${classrooms.length} classrooms for ${studentEmail}`);

    res.json({ classrooms });
  } catch (err) {
    console.error('❌ Get student classrooms error:', err);
    res.status(500).json({ message: 'Server error fetching classrooms' });
  }
});

module.exports = router;
