import React from "react";
import { useNavigate } from "react-router-dom";
import "./FeaturesBanner.css";

const FeaturesBanner = () => {
  const navigate = useNavigate();

  const handleVoiceTutorClick = () => {
    navigate('/tutorpage');
  };

  const handleChatbotClick = () => {
    navigate('/chatbotpage');
  };
  const handleVmeetClick = () => {
    navigate('/vmeet');
  };

  return (
    <section className="features-section" id="features">
      <div className="section-container">

        {/* Section Header */}
        <header className="section-header">
          <h2 className="section-heading">
            <span>Powerful Features of</span>{" "}
            <span className="brand-highlight">NextEd AI</span>
          </h2>
          <p className="section-subtitle">
            Empower your educational journey with our cutting-edge AI-driven tools designed for the future of learning.
          </p>
        </header>

        {/* Features Layout */}
        <div className="features-layout">
          {/* Left: Features Grid */}
          <div className="features-grid">
            {/* Feature 1: Smart Classroom */}
            <article className="feature-card">
              <div className="feature-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="8"
                    y="12"
                    width="32"
                    height="24"
                    rx="3"
                    stroke="#1089D3"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M14 42L24 36L34 42"
                    stroke="#1089D3"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="24"
                    y1="36"
                    x2="24"
                    y2="40"
                    stroke="#1089D3"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M16 20L22 26L32 16"
                    stroke="#1089D3"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="feature-title">Smart Classroom Management</h3>
              <p className="feature-description">
                Centralized platform for managing classes, assignments,
                attendance, and real-time student progress tracking.
              </p>
            </article>

            {/* Feature 2: AI Study Chatbot */}
            <article className="feature-card">
              <div className="feature-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="10"
                    y="10"
                    width="28"
                    height="28"
                    rx="4"
                    stroke="#1089D3"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M18 22H30M18 28H26"
                    stroke="#1089D3"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="36"
                    cy="36"
                    r="8"
                    fill="#E0E5EC"
                    stroke="#1089D3"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M33 36L35 38L39 34"
                    stroke="#1089D3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="feature-title">AI Study Chatbot</h3>
              <p className="feature-description">
                Get instant answers to your academic questions with our
                intelligent chatbot powered by advanced AI.
              </p>
            </article>

            {/* Feature 3: Voice-Based AI Tutor */}
            <article className="feature-card">
              <div className="feature-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="20"
                    y="10"
                    width="8"
                    height="16"
                    rx="4"
                    stroke="#1089D3"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M12 22C12 22 12 32 24 32C36 32 36 22 36 22"
                    stroke="#1089D3"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="24"
                    y1="32"
                    x2="24"
                    y2="38"
                    stroke="#1089D3"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="16"
                    y1="38"
                    x2="32"
                    y2="38"
                    stroke="#1089D3"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="14" cy="18" r="2" fill="#1089D3" />
                  <circle cx="34" cy="18" r="2" fill="#1089D3" />
                  <circle cx="14" cy="24" r="2" fill="#1089D3" />
                  <circle cx="34" cy="24" r="2" fill="#1089D3" />
                </svg>
              </div>
              <h3 className="feature-title">Voice-Based AI Tutor</h3>
              <p className="feature-description">
                Learn naturally through voice interactions with your personal AI
                tutor for hands-free education.
              </p>
            </article>

            {/* Feature 4: Online Exams */}
            <article className="feature-card">
              <div className="feature-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="14"
                    y="8"
                    width="20"
                    height="32"
                    rx="3"
                    stroke="#1089D3"
                    strokeWidth="2.5"
                  />
                  <line
                    x1="18"
                    y1="16"
                    x2="26"
                    y2="16"
                    stroke="#1089D3"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="18"
                    y1="22"
                    x2="30"
                    y2="22"
                    stroke="#1089D3"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="18"
                    y1="28"
                    x2="28"
                    y2="28"
                    stroke="#1089D3"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="19"
                    cy="33"
                    r="1.5"
                    stroke="#1089D3"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M24 32L26 34L30 30"
                    stroke="#1089D3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="feature-title">Online Exams & Auto Evaluation</h3>
              <p className="feature-description">
                Create and conduct adaptive online exams with intelligent
                auto-grading and detailed analytics.
              </p>
            </article>

            {/* Feature 5: Personalized Study Tips */}
            <article className="feature-card">
              <div className="feature-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="24"
                    cy="24"
                    r="14"
                    stroke="#1089D3"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M24 16V24L30 27"
                    stroke="#1089D3"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M38 20L42 24L38 28"
                    stroke="#1089D3"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 20L6 24L10 28"
                    stroke="#1089D3"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="feature-title">Personalized Study Tips</h3>
              <p className="feature-description">
                Receive AI-driven study recommendations tailored to your learning
                style and performance patterns.
              </p>
            </article>

            {/* Feature 6: Role-Based Dashboards */}
            <article className="feature-card">
              <div className="feature-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="6"
                    y="12"
                    width="36"
                    height="26"
                    rx="3"
                    stroke="#1089D3"
                    strokeWidth="2.5"
                  />
                  <line
                    x1="12"
                    y1="20"
                    x2="22"
                    y2="20"
                    stroke="#1089D3"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="12"
                    y1="26"
                    x2="18"
                    y2="26"
                    stroke="#1089D3"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <rect
                    x="26"
                    y="18"
                    width="10"
                    height="6"
                    rx="1.5"
                    stroke="#1089D3"
                    strokeWidth="2"
                  />
                  <rect
                    x="26"
                    y="26"
                    width="10"
                    height="6"
                    rx="1.5"
                    stroke="#1089D3"
                    strokeWidth="2"
                  />
                  <circle cx="32" cy="16" r="2" fill="#1089D3" />
                </svg>
              </div>
              <h3 className="feature-title">Role-Based Dashboards</h3>
              <p className="feature-description">
                Customized interfaces for students, teachers, and administrators
                with relevant tools and insights.
              </p>
            </article>

            {/* Feature 7: Vmeet Virtual Meetings */}
            <article className="feature-card">
              <div className="feature-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="8"
                    y="12"
                    width="24"
                    height="22"
                    rx="3"
                    stroke="#1089D3"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M32 18L40 14V34L32 30"
                    stroke="#1089D3"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="16" cy="23" r="3" fill="#1089D3" />
                </svg>
              </div>
              <h3 className="feature-title">Vmeet Virtual Meetings</h3>
              <p className="feature-description">
                Seamless video conferencing integrated into your learning
                environment for lectures and discussions.
              </p>
            </article>
          </div>

          {/* Right: Highlighted Features */}
          <div className="highlighted-features">
            {/* Highlight 1: AI Voice Tutor */}
            <article className="highlight-card">
              <div className="highlight-icon">
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 56 56"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id="voiceGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        style={{ stopColor: "#1089D3", stopOpacity: 1 }}
                      />
                      <stop
                        offset="100%"
                        style={{ stopColor: "#12B1D1", stopOpacity: 1 }}
                      />
                    </linearGradient>
                  </defs>
                  <rect
                    x="22"
                    y="12"
                    width="12"
                    height="24"
                    rx="6"
                    stroke="url(#voiceGradient)"
                    strokeWidth="3"
                  />
                  <path
                    d="M12 30C12 30 12 42 28 42C44 42 44 30 44 30"
                    stroke="url(#voiceGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <line
                    x1="28"
                    y1="42"
                    x2="28"
                    y2="50"
                    stroke="url(#voiceGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <line
                    x1="18"
                    y1="50"
                    x2="38"
                    y2="50"
                    stroke="url(#voiceGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="14" cy="26" r="2.5" fill="url(#voiceGradient)" />
                  <circle cx="42" cy="26" r="2.5" fill="url(#voiceGradient)" />
                  <circle cx="14" cy="34" r="2.5" fill="url(#voiceGradient)" />
                  <circle cx="42" cy="34" r="2.5" fill="url(#voiceGradient)" />
                </svg>
              </div>
              <h3 className="highlight-title">AI Voice Tutor</h3>
              <p className="highlight-description">
                Experience interactive learning through natural voice
                conversations. Ask questions, get explanations, and learn at your
                own pace with our advanced voice-enabled AI tutor.
              </p>
              <button
                className="highlight-button"
                onClick={handleVoiceTutorClick}
              >
                Try AI Tutor
              </button>
            </article>

            {/* Highlight 2: AI Study Chatbot */}
            <article className="highlight-card">
              <div className="highlight-icon">
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 56 56"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id="chatGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        style={{ stopColor: "#1089D3", stopOpacity: 1 }}
                      />
                      <stop
                        offset="100%"
                        style={{ stopColor: "#12B1D1", stopOpacity: 1 }}
                      />
                    </linearGradient>
                  </defs>
                  <rect
                    x="8"
                    y="10"
                    width="40"
                    height="36"
                    rx="6"
                    stroke="url(#chatGradient)"
                    strokeWidth="3"
                  />
                  <path
                    d="M16 24H40M16 32H32"
                    stroke="url(#chatGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="44"
                    cy="44"
                    r="10"
                    fill="#E0E5EC"
                    stroke="url(#chatGradient)"
                    strokeWidth="3"
                  />
                  <path
                    d="M40 44L42 46L48 40"
                    stroke="url(#chatGradient)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="highlight-title">AI Study Chatbot</h3>
              <p className="highlight-description">
                Get instant doubt resolution 24/7 with our intelligent study
                chatbot. From complex math problems to essay guidance, your AI
                study companion is always ready to help.
              </p>
              <button
                className="highlight-button"
                onClick={handleChatbotClick}
              >
                Open Chatbot
              </button>
            </article>

            {/* Highlight 3: Vmeet Meetings */}
            <article className="highlight-card">
              <div className="highlight-icon">
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 56 56"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id="vmeetGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        style={{ stopColor: "#1089D3", stopOpacity: 1 }}
                      />
                      <stop
                        offset="100%"
                        style={{ stopColor: "#12B1D1", stopOpacity: 1 }}
                      />
                    </linearGradient>
                  </defs>
                  <rect
                    x="8"
                    y="14"
                    width="30"
                    height="28"
                    rx="4"
                    stroke="url(#vmeetGradient)"
                    strokeWidth="3"
                  />
                  <path
                    d="M38 22L48 16V40L38 34"
                    stroke="url(#vmeetGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="18" cy="28" r="4" fill="url(#vmeetGradient)" />
                </svg>
              </div>
              <h3 className="highlight-title">Vmeet Meetings</h3>
              <p className="highlight-description">
                High-quality, integrated video conferencing designed specifically
                for digital learning. Host live classes, webinars, and group
                discussions with ease.
              </p>
              <button
                className="highlight-button"
                onClick={handleVmeetClick}
              >
                Join Meeting
              </button>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesBanner;
