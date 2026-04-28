import React from 'react';
import './NotificationModal.css';

const NotificationModal = ({ isOpen, onClose, title, message, subtext, buttonText, type, onButtonClick }) => {
  if (!isOpen) return null;

  const handleBtnClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      onClose();
    }
  };

  return (
    <div className="notification-modal-overlay">
      <div className="notification-modal-content">
        <div className="notification-modal-header">
          <h3>{title || "Notification"}</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="notification-modal-body">
          <p style={{ color: '#334155', fontWeight: '500', minHeight: '1.2em' }}>
            {message || "Action processed successfully."}
          </p>
          <div className="modal-icon">
            {type === 'error' ? (
              <svg width="70" height="70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="1.5" fill="rgba(239, 68, 68, 0.1)"/>
                <path d="M12 8V12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1" fill="#ef4444"/>
              </svg>
            ) : type === 'success' ? (
              <svg width="70" height="70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="1.5" fill="rgba(34, 197, 94, 0.1)"/>
                <path d="M8 12.5L10.5 15L16 9" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : type === 'warning' ? (
              <svg width="70" height="70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="1.5" fill="rgba(245, 158, 11, 0.1)"/>
                <path d="M12 8V12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1" fill="#f59e0b"/>
              </svg>
            ) : (
              <svg width="70" height="70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#1089D3" strokeWidth="1.5" fill="rgba(16, 137, 211, 0.1)"/>
                <path d="M12 16V12" stroke="#1089D3" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="8" r="1" fill="#1089D3"/>
              </svg>
            )}
          </div>
          {subtext && <p className="subtext">{subtext}</p>}
        </div>
        <div className="notification-modal-footer">
          <button className="notification-btn" onClick={handleBtnClick}>
            {buttonText || "Okay"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
