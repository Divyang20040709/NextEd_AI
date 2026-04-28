const express = require('express');
const router = express.Router();
const Exam = require('../model/Exam');
const ExamSubmission = require('../model/ExamSubmission');
const Classroom = require('../model/Classroom');
const User = require('../model/User');

// Create a new exam
router.post('/create', async (req, res) => {
  try {
    const { classroomId, teacherName, examName, subject, questions } = req.body;

    const newExam = new Exam({
      classroomId,
      teacherName,
      examName,
      subject,
      questions
    });

    await newExam.save();

    const io = req.app.get('socketio');
    if (io) {
      io.emit('new-exam', { classroomId, examName });
    }

    res.status(201).json({ success: true, message: 'Exam created successfully', exam: newExam });
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({ success: false, message: 'Failed to create exam' });
  }
});

// Get all exams for a classroom
router.get('/classroom/:classroomId', async (req, res) => {
  try {
    const exams = await Exam.find({ classroomId: req.params.classroomId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, exams });
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exams' });
  }
});

// Get a single exam by ID
router.get('/:examId', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.status(200).json({ success: true, exam });
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exam details' });
  }
});


// Delete an exam
router.delete('/:examId', async (req, res) => {
  try {
    const examId = req.params.examId;
    
    // Delete the exam
    await Exam.findByIdAndDelete(examId);
    
    // Also delete all submissions for this exam
    await ExamSubmission.deleteMany({ examId: examId });

    // Optional: emit socket event if needed for realtime updates
    // const io = req.app.get('socketio');
    // io.emit('exam-deleted', { examId: examId, message: "The exam has been deleted by teacher" });

    res.status(200).json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({ success: false, message: 'Failed to delete exam' });
  }
});

// Get submissions for a specific exam
router.get('/:examId/submissions', async (req, res) => {
  try {
    const submissions = await ExamSubmission.find({ examId: req.params.examId }).sort({ submittedAt: -1 });
    res.status(200).json({ success: true, submissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch submissions' });
  }
});

// Submit an exam (for student side, though we only implement teacher side now, this is useful for future or full picture)
router.post('/submit', async (req, res) => {
  try {
    const { examId, studentId, studentName, rollNumber, answers } = req.body;
    
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    let correctCount = 0;
    let wrongCount = 0;
    
    const processedAnswers = answers.map(ans => {
      const question = exam.questions.id(ans.questionId);
      const isCorrect = question.correctAnswer === ans.selectedOption;
      if (isCorrect) correctCount++;
      else wrongCount++;
      
      return {
        questionId: ans.questionId,
        selectedOption: ans.selectedOption,
        isCorrect
      };
    });

    const newSubmission = new ExamSubmission({
      examId,
      examName: exam.examName,
      subject: exam.subject,
      studentId,
      studentName,
      rollNumber,
      totalQuestions: exam.questions.length,
      correctCount,
      wrongCount,
      answers: processedAnswers
    });

    await newSubmission.save();
    res.status(201).json({ success: true, message: 'Exam submitted successfully', submission: newSubmission });
  } catch (error) {
    console.error('Error submitting exam:', error);
    res.status(500).json({ success: false, message: 'Failed to submit exam' });
  }
});

// Get submissions for a specific student
router.get('/student-submissions/:studentEmail', async (req, res) => {
  try {
    const submissions = await ExamSubmission.find({ studentId: req.params.studentEmail })
      .populate('examId', 'examName subject')
      .sort({ submittedAt: -1 });
    res.status(200).json({ success: true, submissions });
  } catch (error) {
    console.error('Error fetching student submissions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student submissions' });
  }
});

module.exports = router;
