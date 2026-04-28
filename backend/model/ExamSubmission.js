const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  examName: {
    type: String,
    required: false
  },
  subject: {
    type: String,
    required: false
  },
  studentId: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  rollNumber: {
    type: String,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  correctCount: {
    type: Number,
    required: true
  },
  wrongCount: {
    type: Number,
    required: true
  },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedOption: { type: String, enum: ['a', 'b', 'c', 'd', ''], default: '' },
    isCorrect: { type: Boolean, required: true }
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ExamSubmission', submissionSchema);
