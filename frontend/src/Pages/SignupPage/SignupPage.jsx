import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import './SignupPage.css';

const SignupPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <section className="signup-section">
        <div className="signup-floating-wrapper">
          <div className="signup-container">
            <header className="signup-header">
              <h1 className="signup-title">
                Join <span className="brand-highlight">NextEd AI</span>
              </h1>
              <p className="signup-subtitle">
                Choose your role to get started with your learning journey.
              </p>
            </header>

            <div className="signup-cards-wrapper selection-wrapper">
              {/* Student Selection Card */}
              <div className="signup-card selection-card student" onClick={() => navigate('/signup/student')}>
                <div className="large-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </div>
                <h2 className="card-title">Signup as Student</h2>
                <p className="card-description">
                  Join classes, access AI tutors, and track your progress.
                </p>
                <button className="signup-button selection-btn">
                  Select Student
                </button>
              </div>

              {/* Teacher Selection Card */}
              <div className="signup-card selection-card teacher" onClick={() => navigate('/signup/teacher')}>
                <div className="large-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                </div>
                <h2 className="card-title">Signup as Teacher</h2>
                <p className="card-description">
                  Create classrooms, manage students, and monitor performance.
                </p>
                <button className="signup-button selection-btn">
                  Select Teacher
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default SignupPage;
