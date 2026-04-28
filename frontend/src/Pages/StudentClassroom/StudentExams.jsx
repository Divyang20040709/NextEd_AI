import React, { useState, useEffect } from "react";
import { examAPI } from "../../utils/api";
import NotificationModal from "../../Components/NotificationModal/NotificationModal";
import "./StudentExams.css";

const Icons = {
  Play: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
  ),
  Analytics: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
  ),
  Check: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
  ),
  X: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  ),
  Clock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
  ),
  List: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
  )
};

const StudentExams = ({ classroom, studentData, postSearch = "" }) => {
  const [currentView, setCurrentView] = useState("dashboard"); // 'dashboard', 'take-exam', 'analytics'
  const [exams, setExams] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const [notification, setNotification] = useState({ isOpen: false, title: "", message: "", type: "success" });

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    // Fetch exams for this classroom
    const examResult = await examAPI.getClassroomExams(classroom._id);
    let fetchedExams = [];
    if (examResult.success) {
      fetchedExams = examResult.data.exams;
      setExams(fetchedExams);
    }
    
    // Fetch submissions for this student across all exams
    if (studentData?.email) {
      const subResult = await examAPI.getStudentSubmissions(studentData.email);
      if (subResult.success) {
        setMySubmissions(subResult.data.submissions);
      }
    }
    setIsLoading(false);
  }, [classroom._id, studentData]);

  useEffect(() => {
    if (currentView === "dashboard") {
      fetchData();
    }
  }, [currentView, fetchData]);

  const handleStartExam = (exam) => {
    setSelectedExam(exam);
    setCurrentView("take-exam");
    // Set exam active state for navigation guards
    localStorage.setItem('isExamActive', 'true');
    window.dispatchEvent(new Event('storage'));
  };

  const handleViewResult = (exam, submission) => {
    setSelectedExam(exam);
    setSelectedSubmission(submission);
    setCurrentView("analytics");
  };

  const renderDashboard = () => (
    <div className="student-exams-dashboard fade-in">
      <div className="exams-header-text">
        <h3>Classroom Exams</h3>
        <p>View your pending and completed exams for {classroom.subject}.</p>
      </div>

      <div className="student-exams-table-container">
        {isLoading && exams.length === 0 ? (
          <p className="loading-text">Loading your exams...</p>
        ) : exams.length === 0 ? (
          <div className="empty-state-exam">
             <div className="empty-icon">
               <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#cbd5e1' }}>
                 <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                 <polyline points="14 2 14 8 20 8"></polyline>
                 <line x1="16" y1="13" x2="8" y2="13"></line>
                 <line x1="16" y1="17" x2="8" y2="17"></line>
                 <polyline points="10 9 9 9 8 9"></polyline>
               </svg>
             </div>
             <h4>No Exams Yet</h4>
             <p>Your teacher hasn't published any exams for this classroom.</p>
          </div>
        ) : (
          <div className="responsive-table-wrapper">
            <table className="exams-table">
              <thead>
                <tr>
                  <th>Exam Name</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Questions</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {exams
                  .filter(exam => exam.examName.toLowerCase().includes(postSearch.toLowerCase()))
                  .map(exam => {
                  const d = new Date(exam.createdAt);
                  const submission = mySubmissions.find(sub => (typeof sub.examId === 'object' ? sub.examId._id : sub.examId) === exam._id);
                  const isCompleted = !!submission;

                  return (
                    <tr key={exam._id}>
                      <td className="fw-500">{exam.examName}</td>
                      <td>{d.toLocaleDateString()}</td>
                      <td>{d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</td>
                      <td>{exam.questions.length}</td>
                      <td>
                        {isCompleted ? (
                          <span className="status-badge completed">Completed</span>
                        ) : (
                          <span className="status-badge pending">Pending</span>
                        )}
                      </td>
                      <td>
                        {isCompleted ? (
                          <button className="table-action-btn result-btn" onClick={() => handleViewResult(exam, submission)}>
                            <Icons.Analytics /> Result
                          </button>
                        ) : (
                          <button className="table-action-btn start-exam-btn" onClick={() => handleStartExam(exam)}>
                            <Icons.Play /> Start Exam
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="student-exams-wrapper">
      {currentView === "dashboard" && renderDashboard()}
      
      {currentView === "take-exam" && (
        <TakeExamInterface 
           exam={selectedExam} 
           studentData={studentData} 
           onBack={() => {
             localStorage.removeItem('isExamActive');
             window.dispatchEvent(new Event('storage'));
             setCurrentView("dashboard");
           }} 
           onComplete={() => {
             localStorage.removeItem('isExamActive');
             window.dispatchEvent(new Event('storage'));
             setNotification({ isOpen: true, title: "Exam Submitted!", message: "Your answers have been saved and evaluated.", type: "success" });
             setCurrentView("dashboard");
           }} 
        />
      )}
      
      {currentView === "analytics" && (
        <StudentAnalytics 
           submission={selectedSubmission} 
           exam={selectedExam} 
           onBack={() => setCurrentView("dashboard")} 
        />
      )}

      <NotificationModal 
        isOpen={notification.isOpen} 
        onClose={() => setNotification({ ...notification, isOpen: false })} 
        title={notification.title} 
        message={notification.message} 
        type={notification.type} 
      />
    </div>
  );
};

// ==========================================
// SUB-COMPONENTS
// ==========================================

const TakeExamInterface = ({ exam, studentData, onBack, onComplete }) => {
  const [answers, setAnswers] = useState({}); // { questionId: 'a' }
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOptionSelect = (qId, optionKey) => {
    setAnswers({ ...answers, [qId]: optionKey });
  };

  const calculateProgress = () => {
    const answeredCount = Object.keys(answers).length;
    return Math.round((answeredCount / exam.questions.length) * 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(answers).length < exam.questions.length) {
       alert("Please answer all questions before submitting.");
       return;
    }
    
    setIsSubmitting(true);
    
    const formattedAnswers = Object.entries(answers).map(([qId, selectedOpt]) => ({
      questionId: qId,
      selectedOption: selectedOpt
    }));

    const payload = {
      examId: exam._id,
      studentId: studentData.email,
      studentName: studentData.name || 'Student',
      rollNumber: studentData.studentId || studentData.rollNumber || studentData.email || 'N/A', // Prioritize studentId from signup
      answers: formattedAnswers
    };

    const result = await examAPI.submitExam(payload);
    setIsSubmitting(false);

    if (result.success) {
      onComplete();
    } else {
      alert(result.message || "Failed to submit exam");
    }
  };

  const progress = calculateProgress();

  return (
    <div className="take-exam-view fade-in">
      <div className="exam-sticky-header">
        <div className="exam-header-top">
          <button className="back-btn" onClick={onBack} disabled={isSubmitting}>← Exit Exam</button>
          <h2>{exam.examName}</h2>
        </div>
        <div className="exam-info-bar">
          <div className="info-item"><Icons.List /> {exam.questions.length} Questions</div>
          <div className="info-item"><Icons.Clock /> {exam.subject}</div>
        </div>
        <div className="progress-bar-container">
           <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <form className="exam-questions-form container-fluid" style={{ padding: 0 }} onSubmit={handleSubmit}>
        {exam.questions.map((q, idx) => (
          <div key={q._id} className="student-question-card form-card-dashboard">
            <h4><span className="q-num">Q{idx + 1}.</span> {q.questionText}</h4>
            <div className="options-list">
              {['a', 'b', 'c', 'd'].map(opt => (
                 <label 
                   key={opt} 
                   className={`option-label ${answers[q._id] === opt ? 'selected' : ''}`}
                 >
                   <input 
                     type="radio" 
                     name={`question-${q._id}`} 
                     value={opt} 
                     checked={answers[q._id] === opt}
                     onChange={() => handleOptionSelect(q._id, opt)}
                     required
                   />
                   <div className="opt-letter">{opt.toUpperCase()}</div>
                   <div className="opt-text">{q.options[opt]}</div>
                 </label>
              ))}
            </div>
          </div>
        ))}
        
        <div className="exam-submit-footer form-card-dashboard">
          <p>Please review your answers before submitting. Once submitted, it cannot be changed.</p>
          <button type="submit" className="submit-exam-btn" disabled={isSubmitting || progress < 100}>
            {isSubmitting ? "Submitting..." : "Complete & Submit Exam"}
          </button>
        </div>
      </form>
    </div>
  );
};

const StudentAnalytics = ({ submission, exam, onBack }) => {
  const total = submission.totalQuestions;
  const correctPercent = (submission.correctCount / total) * 100 || 0;
  
  const chartStyle = {
    background: `conic-gradient(#22c55e 0% ${correctPercent}%, #ef4444 ${correctPercent}% 100%)`
  };

  return (
    <div className="student-analytics-view fade-in transform-bounce">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Back to Exams</button>
        <h2>Your Result: {exam.examName}</h2>
      </div>

      <div className="analytics-summary-cards">
        <div className="counters-section">
          <div className="counter-box total analytics-expanded-card">
            <h3>Total Questions</h3>
            <span className="count">{submission.totalQuestions}</span>
          </div>
          <div className="counter-box correct analytics-expanded-card">
            <h3>Correct Answers</h3>
            <span className="count">{submission.correctCount}</span>
          </div>
          <div className="counter-box wrong analytics-expanded-card">
            <h3>Wrong Answers</h3>
            <span className="count">{submission.wrongCount}</span>
          </div>
        </div>

        <div className="chart-section analytics-expanded-card">
          <h3>Accuracy Breakdown</h3>
          <div className="pie-chart-container">
            <div className="pie-chart" style={chartStyle}></div>
            <div className="pie-legend">
              <div className="legend-item"><span className="dot dot-correct"></span> Correct ({submission.correctCount})</div>
              <div className="legend-item"><span className="dot dot-wrong"></span> Wrong ({submission.wrongCount})</div>
            </div>
          </div>
        </div>
      </div>

      <div className="detailed-answers analytics-expanded-card">
        <h3>Question Breakdown</h3>
        <p className="subtitle" style={{marginBottom: '20px', color: '#64748b'}}>Review your selected answers versus the correct answers.</p>
        <div className="answers-list">
          {submission.answers.map((ans, idx) => {
            const questionData = exam.questions.find(q => q._id === ans.questionId);
            if (!questionData) return null;

            const isCorrect = ans.isCorrect;
            
            return (
              <div key={idx} className={`answer-card ${isCorrect ? 'answer-correct' : 'answer-wrong'}`}>
                <div className="q-header">
                  <h4>Q{idx + 1}: {questionData.questionText}</h4>
                  <div className="status-icon">
                    {isCorrect ? <Icons.Check /> : <Icons.X />}
                  </div>
                </div>
                
                <div className="selected-option-visual">
                  Your Answer: <strong>{ans.selectedOption ? ans.selectedOption.toUpperCase() : "None"}</strong> {ans.selectedOption ? `(${questionData.options[ans.selectedOption]})` : ""}
                </div>

                {!isCorrect && (
                  <div className="correct-answer-visual">
                    Correct Answer: <strong>{questionData.correctAnswer.toUpperCase()}</strong> ({questionData.options[questionData.correctAnswer]})
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudentExams;
