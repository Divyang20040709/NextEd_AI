const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  institutionName: { type: String, required: true },
  designation: { type: String, required: true },
  department: { type: String, required: true },
  role: { type: String, default: 'admin' }, // Just for frontend consistency
}, { 
  timestamps: true, 
  collection: 'admins' 
});

module.exports = mongoose.model('Admin', adminSchema);
