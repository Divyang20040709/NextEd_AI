import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import socket, { connectSocket } from "../../utils/socket";
import { notifyAuthChange } from "../../utils/api";
import "./Navbar.css";
import { showToast } from "../../utils/CustomToast";


const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authState, setAuthState] = useState({
    exists: false,
    isLoggedIn: false,
    role: '',
    name: ''
  });
  const navigate = useNavigate();
  const location = useLocation();

  const getEffectiveRole = () => {
    // Determine the role for styling based on the current context
    if (location.pathname.includes('/admin')) return 'admin';
    if (location.pathname.includes('/teacher')) return 'teacher';
    if (location.pathname.includes('/student')) return 'student';
    
    // If logged in, use the stored role (e.g. teacher on homepage still shows green)
    if (authState.isLoggedIn && authState.role) {
      return authState.role;
    }
    
    // Check pending signup state if not logged in
    if (authState.exists && !authState.isLoggedIn && authState.role) {
       return authState.role;
    }
    
    // Default fallback
    return 'student'; 
  };
  const currentThemeRole = getEffectiveRole();

  const [hasNotification, setHasNotification] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const storedData = localStorage.getItem('user_data');
      const pendingData = localStorage.getItem('pending_signup');
      const hasApprovedUpdate = localStorage.getItem('has_approval_update');
      
      setHasNotification(!!hasApprovedUpdate);

      if (storedData) {
        const userData = JSON.parse(storedData);
        setAuthState({
          exists: true,
          isLoggedIn: userData.isLoggedIn,
          role: userData.role,
          name: userData.name
        });
      } else if (pendingData) {
        setAuthState({
          exists: true,
          isLoggedIn: false,
          role: '',
          name: ''
        });
      } else {
        setAuthState({
          exists: false,
          isLoggedIn: false,
          role: '',
          name: ''
        });
      }
    };

    checkAuth();
    // 'storage' fires when ANOTHER tab changes localStorage
    window.addEventListener('storage', checkAuth);
    // 'authStateChanged' fires when THIS tab changes localStorage (custom event)
    window.addEventListener('authStateChanged', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authStateChanged', checkAuth);
    };
  }, []);


  // Handle Socket Listeners for Status Updates (Approval / Ban / Unban)
  useEffect(() => {
    const pendingData = localStorage.getItem('pending_signup');
    const userData = localStorage.getItem('user_data');
    
    let email = '';
    
    if (pendingData) {
      email = JSON.parse(pendingData).email;
    } else if (userData) {
      email = JSON.parse(userData).email;
    }

    if (!email) return;

    connectSocket(email);

    const handleStatusUpdate = (data) => {
      console.log("Navbar: status update received:", data.status);
      
      if (data.status === 'approved') {
        // New approval OR unban → show red dot so user knows they can login
        localStorage.setItem('has_approval_update', 'true');
        notifyAuthChange();
        showToast(data.message || "✅ Your account has been approved! You can now login.", "success");

      } else if (data.status === 'rejected') {
        // Rejected → clear pending_signup so they can re-signup
        localStorage.removeItem('pending_signup');
        localStorage.removeItem('has_approval_update');
        notifyAuthChange();
        showToast(`❌ Your application was rejected. ${data.reason || ""}`, "error");
        navigate('/signup');

      }
      // NOTE: 'banned' and 'deleted' are handled by GlobalAuthHandler
      // which shows a proper confirmation popup + then redirects.
      // Navbar should NOT duplicate that logic.
    };


    socket.on('teacher-status-updated', handleStatusUpdate);
    socket.on('student-status-updated', handleStatusUpdate);

    return () => {
      socket.off('teacher-status-updated', handleStatusUpdate);
      socket.off('student-status-updated', handleStatusUpdate);
    };
  }, [authState.exists, navigate]); // Re-run when auth exists/doesn't exist

  const handleHamburgerClick = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleNavClick = (path, name) => {
    if (localStorage.getItem('isExamActive') === 'true') {
      showToast(`⚠️ You cannot move to ${name} page during exam!`, "error");
      return;
    }
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogoClick = () => {
    if (localStorage.getItem('isExamActive') === 'true') {
      showToast("⚠️ You cannot leave during exam!", "error");
      return;
    }
    navigate("/");
    setMobileOpen(false);
  };

  const handleAuthButtonClick = () => {
    if (localStorage.getItem('isExamActive') === 'true') {
      showToast("⚠️ You cannot leave during exam!", "error");
      return;
    }
    if (!authState.exists) {
      navigate('/signup');
    } else if (!authState.isLoggedIn) {
      navigate('/login');
    } else {
      // Navigate to dashboard based on role
      navigate(authState.role === 'teacher' ? '/teacher' : '/student');
    }
    setMobileOpen(false);
  };

  const getButtonText = () => {
    if (!authState.exists) return 'Sign Up';
    if (!authState.isLoggedIn) return 'Login';
    // Return capitalized role name: "Student" or "Teacher"
    return authState.role.charAt(0).toUpperCase() + authState.role.slice(1);
  };



  return (
    <>
      <nav className="navbar-container">
        <div className="navbar">
          {/* Logo */}
          <div className="logo-section" onClick={handleLogoClick}>
            <span className="logo-text" id="brandName">
              NextEd AI
            </span>
          </div>


          {/* Desktop nav links */}
          <ul className="nav-links">
            <li>
              <button
                onClick={() => handleNavClick("/homepage", "Home")}
                className={`nav-link ${location.pathname === "/homepage" ? "active" : ""}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick("/chatbotpage", "ChatBot")}
                className={`nav-link ${location.pathname === "/chatbotpage" ? "active" : ""}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
              >
                ChatBot
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick("/tutorpage", "AITutor")}
                className={`nav-link ${location.pathname === "/tutorpage" ? "active" : ""}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
              >
                AITutor
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick("/vmeet", "Vmeet")}
                className={`nav-link ${location.pathname === "/vmeet" ? "active" : ""}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
              >
                Vmeet
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavClick("/aboutpage", "About")}
                className={`nav-link ${location.pathname === "/aboutpage" ? "active" : ""}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
              >
                About
              </button>
            </li>
          </ul>

          {/* Desktop login button */}
          <button
            className={`login-button role-${currentThemeRole} ${hasNotification ? 'has-notification' : ''}`}
            id="loginButton"
            onClick={handleAuthButtonClick}
          >
            {getButtonText()}
            {hasNotification && <span className="notification-dot"></span>}
          </button>


          {/* Hamburger */}
          <div
            className={
              "hamburger-menu" + (mobileOpen ? " active" : "")
            }
            id="hamburgerMenu"
            onClick={handleHamburgerClick}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={
            "mobile-menu" + (mobileOpen ? " active" : "")
          }
          id="mobileMenu"
        >
          <button
            className="mobile-nav-link"
            onClick={() => handleNavClick("/homepage", "Home")}
          >
            Home
          </button>
          <button
            className="mobile-nav-link"
            onClick={() => handleNavClick("/chatbotpage", "ChatBot")}
          >
            ChatBot
          </button>
          <button
            className="mobile-nav-link"
            onClick={() => handleNavClick("/tutorpage", "AITutor")}
          >
            AITutor
          </button>
          <button
            className="mobile-nav-link"
            onClick={() => handleNavClick("/vmeet", "Vmeet")}
          >
            Vmeet
          </button>
          <button
            className="mobile-nav-link"
            onClick={() => handleNavClick("/aboutpage", "About")}
          >
            About
          </button>
          <button
            className={`mobile-login-button role-${currentThemeRole} ${hasNotification ? 'has-notification' : ''}`}
            id="mobileLoginButton"
            onClick={handleAuthButtonClick}
          >
            {getButtonText()}
            {hasNotification && <span className="notification-dot"></span>}
          </button>

        </div>
      </nav>
    </>
  );
};

export default Navbar;
