import React from "react";
import "./AboutProjectBanner.css";
import { useNavigate } from "react-router-dom";
import Logo from "../../assets/Logo.jpg";

const defaultConfig = {
  title: "NextEd AI",
  tagline: "An Advanced AI-Powered Digital Learning Ecosystem",
  description:
    "NextEd AI is a comprehensive, AI-driven educational platform that seamlessly integrates classroom management, AI-powered doubt solving, voice-based tutoring, automated exam generation, and personalized learning insights into one centralized system. Designed for both teachers and students, NextEd AI transforms traditional education into an intelligent, adaptive, and engaging digital experience.",
  feature1: "Unified learning platform for teachers and students",
  feature2: "AI-powered chatbot for instant doubt resolution",
  feature3: "Voice-based AI tutor for natural conversations",
  feature4: "Automated online exams with smart grading",
  feature5: "Personalized study tips and learning insights",
  feature6: "Role-based dashboards for teachers and students",
  feature7: "Real-time classroom management and collaboration",
  cta_button_text: "Explore NextEd AI",
};

const AboutProjectBanner = ({ config = {}, onCtaClick }) => {
  const merged = { ...defaultConfig, ...config };
  const navigate = useNavigate();

  const handleClick = () => {
    if (onCtaClick) {
      onCtaClick();
      return;
    }
    navigate("/homepage");
  };

  return (
    <section className="about-banner-section">
      <div className="about-banner-content">
        {/* LEFT - Logo */}
        <div className="about-visual">
          <div className="logo-container">
            <img src={Logo} alt="NextEd AI Logo" />
          </div>
        </div>

        {/* RIGHT - Content */}
        <div className="about-text-content">
          <div className="about-header">
            <h1 className="about-title">{merged.title}</h1>
            <h2 className="about-tagline">{merged.tagline}</h2>
          </div>
          
          <p className="about-description">{merged.description}</p>

          <div className="about-features">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <div className="feature-item" key={num}>
                <div className="feature-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient
                        id={`feat${num}Grad`}
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
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke={`url(#feat${num}Grad)`}
                      strokeWidth="2"
                    />
                    <path
                      d="M8 12L11 15L16 9"
                      stroke={`url(#feat${num}Grad)`}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="feature-text">{merged[`feature${num}`]}</p>
              </div>
            ))}
          </div>

          <button className="about-cta-button" onClick={handleClick}>
            {merged.cta_button_text}
          </button>
        </div>
      </div>
    </section>
  );
};

export default AboutProjectBanner;
