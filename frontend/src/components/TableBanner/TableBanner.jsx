import React from "react";
import "./TableBanner.css";

const TableBanner = () => {
  return (
    <section className="comparison-section">
      <div className="section-container">
        {/* Section Header */}
        <header className="section-header">
          <h2 className="section-heading">
            <span>Problems in Current Online Education vs</span>{" "}
            <span className="brand-highlight">NextEd AI</span>{" "}
            <span>Solutions</span>
          </h2>
          <p className="section-subtext">
            Discover how NextEd AI transforms scattered educational tools into a
            unified, intelligent learning ecosystem powered by cutting-edge
            artificial intelligence.
          </p>
        </header>

        {/* Comparison Grid */}
        <div className="comparison-grid">
          {/* Problems Card */}
          <article className="comparison-card problems-card">
            <h3 className="card-title">Current Education Challenges</h3>
            <div className="points-list">
              {[
                "Disorganized classroom management tools",
                "Manual and slow exam evaluation process",
                "Lack of 24/7 instant academic support",
                "Non-personalized study recommendations",
                "Limited hands-free voice-based learning",
                "Fragmented data for students and teachers",
                "Non-integrated video conferencing tools"
              ].map((text, idx) => (
                <div className="point-item" key={idx}>
                  <div className="point-icon">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <circle cx="16" cy="16" r="14" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="16" y1="10" x2="16" y2="18" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="16" cy="22" r="1.5" fill="#1089D3" />
                    </svg>
                  </div>
                  <p className="point-text">{text}</p>
                </div>
              ))}
            </div>
          </article>

          {/* Solutions Card */}
          <article className="comparison-card solutions-card">
            <h3 className="card-title gradient-title">
              How NextEd AI Solves This
            </h3>
            <div className="points-list">
              {[
                "Centralized Smart Classroom Management",
                "AI-powered Online Exams & Evaluation",
                "24/7 Intelligent AI Study Chatbot",
                "Personalized AI-driven Study Tips",
                "Interactive Voice-Based AI Tutoring",
                "Integrated Role-Based Dashboards",
                "Reliable Vmeet conferencing integration"
              ].map((text, idx) => (
                <div className="point-item" key={idx}>
                  <div className="point-icon">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <circle cx="16" cy="16" r="14" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M10 16L14 20L22 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="point-text">{text}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};

export default TableBanner;
