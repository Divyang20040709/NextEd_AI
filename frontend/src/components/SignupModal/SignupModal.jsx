import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupModal.css';

const SignupModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSignupClick = () => {
    onClose();
    navigate('/signup');
  };

  return (
    <div className="signup-modal-overlay">
      <div className="signup-modal-content">
        <div className="signup-modal-header">
          <h3>Account Required</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="signup-modal-body">
          <p>You need to create an account to access this feature.</p>
          <div className="modal-icon">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#1089D3"/>
            </svg>
          </div>
          <p className="subtext">Please sign up first to continue your learning journey.</p>
        </div>
        <div className="signup-modal-footer">
          <button className="signup-first-btn" onClick={handleSignupClick}>
            Signup First
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;
