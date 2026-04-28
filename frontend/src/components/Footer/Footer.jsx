import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const navigate = useNavigate();

  // Show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleCTAClick = () => {
    // First navigate to about page (will scroll to top automatically)
    navigate('/aboutpage');
    // Then scroll to contact section after a small delay
    setTimeout(() => {
      const contactElement = document.getElementById('contact');
      if (contactElement) {
        contactElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };



  return (
    <>
      <footer className="footer-container">
        <div className="footer-content">
          {/* Left Section - Navigation Links (EXACT Navbar routes) */}
          <nav className="footer-left" aria-label="Footer Navigation">
            <ul className="footer-nav-list">
              <li>
                <Link 
                  to="/homepage" 
                  className="footer-nav-link"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/chatbotpage" 
                  className="footer-nav-link"
                >
                  ChatBot
                </Link>
              </li>
              <li>
                <Link 
                  to="/tutorpage" 
                  className="footer-nav-link"
                >
                  AITutor
                </Link>
              </li>
              <li>
                <Link 
                  to="/aboutpage" 
                  className="footer-nav-link"
                >
                  About
                </Link>
              </li>
            </ul>
          </nav>

          {/* Middle Section - Branding */}
          <div className="footer-middle">
            <div className="footer-logo-wrapper">
              <h2 className="footer-brand-name">NextEd AI</h2>
            </div>

            <p className="footer-tagline">
              An Advanced AI-Powered Digital Learning Ecosystem
            </p>
            <p className="footer-copyright">&copy; 2025 NextEd AI. All rights reserved.</p>
          </div>

          {/* Right Section - CTA Only */}
          <div className="footer-right">
            <button className="footer-cta-button" onClick={handleCTAClick}>
              Contact Us
            </button>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          className="scroll-top-button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 19V5M12 5L5 12M12 5L19 12"
              stroke="#FFFFFF"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </>
  );
};

export default Footer;
