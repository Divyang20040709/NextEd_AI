const mongoose = require('mongoose');

const teacherSignupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  surname: { type: String, required: false },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: false },
  mobileNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  institutionName: { type: String, required: true },
  designation: { type: String, required: true },
  subject: { type: String, required: true },
  qualifications: { type: String, required: false },
  department: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'banned'], 
    default: 'pending' 
  },
  approvalMessage: { type: String, default: null },
  rejectedReason: { type: String, default: null },
  isBanned: { type: Boolean, default: false }
}, { 
  timestamps: true,
  collection: 'signup_teacher'
});

module.exports = mongoose.model('TeacherSignup', teacherSignupSchema);
