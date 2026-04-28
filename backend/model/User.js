const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ['student', 'teacher'], required: true },
  name: { type: String },
  surname: { type: String },
  gender: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  courseDepartment: { type: String },
  year: { type: String },
  studentId: { type: String },
  subject: { type: String },
  qualifications: { type: String },
  department: { type: String },
  isLoggedIn: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
