const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: {
    a: { type: String, required: true },
    b: { type: String, required: true },
    c: { type: String, required: true },
    d: { type: String, required: true },
  },
  correctAnswer: { type: String, required: true, enum: ["a", "b", "c", "d"] },
});

const examSchema = new mongoose.Schema({
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Classroom",
    required: true,
  },
  teacherName: {
    type: String,
    required: true,
  },
  examName: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  questions: [questionSchema],
  examType: {
    type: String,
    enum: ["manual", "ai"],
    default: "manual"
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Exam", examSchema);
