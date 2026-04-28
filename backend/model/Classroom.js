const mongoose = require('mongoose');

// Helper function to generate unique 6-digit code
const generateClassroomCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const classroomSchema = new mongoose.Schema({
  subject: { 
    type: String, 
    required: true 
  },
  classGrade: { 
    type: String, 
    required: true 
  },
  division: { 
    type: String, 
    required: true 
  },
  teacherEmail: { 
    type: String, 
    required: true,
    lowercase: true,
    index: true
  },
  teacherName: { 
    type: String, 
    required: true 
  },
  code: { 
    type: String, 
    required: true,
    unique: true,
    index: true,
    length: 6
  },
  students: [{
    email: { 
      type: String, 
      required: true,
      lowercase: true
    },
    name: { 
      type: String, 
      required: true 
    },
    studentId: {
      type: String,
      required: false
    },
    joinedAt: { 
      type: Date, 
      default: Date.now 
    }
  }]
}, { 
  timestamps: true 
});

// Index for faster queries
classroomSchema.index({ teacherEmail: 1, createdAt: -1 });
classroomSchema.index({ 'students.email': 1 });

// Export model and helper function
module.exports = mongoose.model('Classroom', classroomSchema);
module.exports.generateClassroomCode = generateClassroomCode;
