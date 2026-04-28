import React from "react";
import "./RoleIntroBanner.css";
import TeacherRolee from "../../assets/TeacherRolee.jpg";
import StudentRole from "../../assets/StudentRole.jpg";
import AdminRole from "../../assets/AdminRole.jpg";

const RoleIntroBanner = () => {
 
 

  return (
    <section className="roles-section">
      <div className="section-container">
        {/* Section Header */}
        <header className="section-header">
          <h2 className="section-heading">
            <span>Choose Your Role in</span>{" "}
            <span className="brand-highlight">NextEd AI</span>
          </h2>
          <p className="section-subtext">
            Experience personalized learning and teaching with AI-powered tools
            designed specifically for your role. Whether you're an educator or a
            learner, NextEd AI adapts to your needs.
          </p>
        </header>

        {/* Roles Grid */}
        <div className="roles-grid">
          {/* Teacher Role Card */}
          <article className="role-card">
            <div className="role-icon-wrapper">
              <div className="role-icon">
                <img 
                    src={TeacherRolee} 
                    alt="Teacher Role" 
                    style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'20px'}}
                />
              </div>
            </div>
            <div className="role-content">
              <h3 className="role-title">Teacher</h3>
              <p className="role-description">
                Empower your teaching with an intelligent ecosystem that automates
                grading, manages class workflows, and provides deep student insights.
              </p>
              <div className="role-points">
                <div className="role-point">
                  <div className="point-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#1089D3" strokeWidth="2.5" />
                      <path d="M8 12L11 15L16 9" stroke="#1089D3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="point-text">Create and manage smart virtual classrooms</p>
                </div>
                <div className="role-point">
                  <div className="point-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#1089D3" strokeWidth="2.5" />
                      <path d="M8 12L11 15L16 9" stroke="#1089D3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="point-text">Design adaptive exams with auto-evaluation</p>
                </div>
                <div className="role-point">
                  <div className="point-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#1089D3" strokeWidth="2.5" />
                      <path d="M8 12L11 15L16 9" stroke="#1089D3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="point-text">Host Vmeet sessions with student approval</p>
                </div>
                <div className="role-point">
                  <div className="point-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#1089D3" strokeWidth="2.5" />
                      <path d="M8 12L11 15L16 9" stroke="#1089D3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="point-text">Share study materials and track progress</p>
                </div>
              </div>
              
            </div>
          </article>

          {/* Student Role Card */}
          <article className="role-card">
            <div className="role-icon-wrapper">
              <div className="role-icon">
                 <img 
                    src={StudentRole} 
                    alt="Student Role" 
                    style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'20px'}}
                 />
              </div>
            </div>
            <div className="role-content">
              <h3 className="role-title">Student</h3>
              <p className="role-description">
                Unlock your full potential with personal AI companions, interactive
                learning paths, and real-time performance tracking.
              </p>
              <div className="role-points">
                <div className="role-point">
                  <div className="point-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#1089D3" strokeWidth="2.5" />
                      <path d="M8 12L11 15L16 9" stroke="#1089D3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="point-text">Join classrooms and access shared materials</p>
                </div>
                <div className="role-point">
                  <div className="point-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#1089D3" strokeWidth="2.5" />
                      <path d="M8 12L11 15L16 9" stroke="#1089D3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="point-text">Use AI Chatbot and Voice Tutor for learning</p>
                </div>
                <div className="role-point">
                  <div className="point-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#1089D3" strokeWidth="2.5" />
                      <path d="M8 12L11 15L16 9" stroke="#1089D3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="point-text">Receive personalized AI-driven study tips</p>
                </div>
                <div className="role-point">
                  <div className="point-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#1089D3" strokeWidth="2.5" />
                      <path d="M8 12L11 15L16 9" stroke="#1089D3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="point-text">Attempt online exams and track performance</p>
                </div>
              </div>
            </div>
          </article>

          {/* Admin Role Card */}
          <article className="role-card">
            <div className="role-icon-wrapper">
              <div className="role-icon">
                 <img 
                    src={AdminRole} 
                    alt="Admin Role" 
                    style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'20px'}}
                 />
              </div>
            </div>
            <div className="role-content">
              <h3 className="role-title">Admin</h3>
              <p className="role-description">
                Maintain complete institutional control with robust management
                panels, security audits, and system-wide visibility.
              </p>
              <div className="role-points">
                <div className="role-point">
                  <div className="point-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#1089D3" strokeWidth="2.5" />
                      <path d="M8 12L11 15L16 9" stroke="#1089D3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="point-text">Manage teacher/student registration requests</p>
                </div>
                <div className="role-point">
                  <div className="point-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#1089D3" strokeWidth="2.5" />
                      <path d="M8 12L11 15L16 9" stroke="#1089D3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="point-text">Monitor platform-wide usage analytics</p>
                </div>
                <div className="role-point">
                  <div className="point-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#1089D3" strokeWidth="2.5" />
                      <path d="M8 12L11 15L16 9" stroke="#1089D3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="point-text">Audit classroom content and global exams</p>
                </div>
                <div className="role-point">
                  <div className="point-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#1089D3" strokeWidth="2.5" />
                      <path d="M8 12L11 15L16 9" stroke="#1089D3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="point-text">System security and user access control</p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};

export default RoleIntroBanner;
