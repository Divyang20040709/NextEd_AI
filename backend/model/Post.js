const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  classroomId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Classroom',
    required: true,
    index: true
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  videoLink: { 
    type: String,
    default: ''
  },
  files: [{
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: String, required: true },
    data: { type: String, required: true } // Base64 encoded
  }],
  teacherName: { 
    type: String, 
    required: true 
  },
  isEdited: { 
    type: Boolean, 
    default: false 
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
  deletedBy: { 
    type: String,
    default: null
  },
  allowStudentUpload: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Index for faster queries
postSchema.index({ classroomId: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
