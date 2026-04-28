import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SignupModal from "../SignupModal/SignupModal";
import NotificationModal from "../NotificationModal/NotificationModal";
import "./HeroBanner.css";

import smartClassroom from '../../assets/smartClassroom.jpg';
import exams from '../../assets/exams.jpg';
import chatbot from '../../assets/chatbot.jpg';
import studytips from '../../assets/studytips.jpeg';
import voicetutor from '../../assets/voicetutor.jpg';
import dashboards from '../../assets/dashboards.jpg';
import vmeet from '../../assets/vmeet.jpg';

const slidesData = [
  {
    id: 0,
    title: "Smart Classroom Management",
    description: "Centralized platform for managing classes, assignments, and real-time progress tracking.",
    image: smartClassroom
  },
  {
    id: 1,
    title: "Online Exams & Auto Evaluation",
    description: "Create and conduct adaptive online exams with intelligent auto-grading and analytics.",
    image: exams
  },
  {
    id: 2,
    title: "AI Study Chatbot",
    description: "Get instant academic answers and doubt resolution 24/7 with our intelligent chatbot.",
    image: chatbot
  },
  {
    id: 3,
    title: "Personalized Study Tips",
    description: "Receive AI-driven study recommendations tailored to your unique learning style.",
    image: studytips
  },
  {
    id: 4,
    title: "Voice-Based AI Tutor",
    description: "Learn naturally through interactive voice conversations with your personal tutor.",
    image: voicetutor
  },
  {
    id: 5,
    title: "Role-Based Dashboards",
    description: "Customized interfaces for students, teachers, and admins with relevant insights.",
    image: dashboards
  },
  {
    id: 6,
    title: "Vmeet Virtual Meetings",
    description: "High-quality, integrated video conferencing designed specifically for digital learning.",
    image: vmeet
  }
];

const HeroBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const navigate = useNavigate();

  // Auto-advance slides every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slidesData.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleDotClick = (index) => {
    setCurrentSlide(index);
  };

  const handleLoginClick = () => {
    const storedData = localStorage.getItem('user_data');
    if (storedData) {
      const userData = JSON.parse(storedData);
      if (userData.isLoggedIn) {
        // Already logged in - show notification modal
        setIsNotificationOpen(true);
      } else {
        // User exists but not logged in
        navigate('/login');
      }
    } else {
      // No user - show signup modal
      setIsModalOpen(true);
    }
  };

  const handleExploreClick = () => {
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-container">
        {/* Left Content */}
        <div className="hero-left">
          <h1 className="hero-heading">
            <span className="brand-highlight">NextEd AI</span>{" "}
            <span>- An Advanced AI powered digital learning ecosystem</span>
          </h1>
          <p className="hero-subtext">
            Experience intelligent classrooms powered by cutting-edge AI
            technology. From personalized AI tutoring and adaptive assessments to
            voice-enabled learning and smart exam systems—transform your
            educational journey with NextEd AI.
          </p>
          <div className="cta-buttons">
            <button className="cta-button" onClick={handleLoginClick}>
              Login
            </button>
            <button className="cta-button" onClick={handleExploreClick}>
              Explore Features
            </button>
          </div>
        </div>

        {/* Right Visual Area */}
        <div className="hero-right">
          <div className="visual-container">
            <div className="slider-content">
              {slidesData.map((slide, index) => (
                <div
                  key={slide.id}
                  className={
                    "slide" + (index === currentSlide ? " active" : "")
                  }
                >
                  <div className="slide-icon">
                    <img 
                      src={slide.image} 
                      alt={slide.title}
                      className="slide-image-placeholder"
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover', 
                        borderRadius: '16px' 
                      }} 
                    />
                  </div>
                  <div className="slide-title">{slide.title}</div>
                  <div className="slide-description">{slide.description}</div>
                </div>
              ))}
            </div>
            <div className="slider-dots">
              {slidesData.map((slide, index) => (
                <span
                  key={slide.id}
                  className={
                    "dot" + (index === currentSlide ? " active" : "")
                  }
                  onClick={() => handleDotClick(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <SignupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <NotificationModal 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)}
        title="Already Logged In"
        message="You are currently logged in to your account."
        buttonText="Got it"
        type="success"
      />
    </section>
  );
};

export default HeroBanner;
