import React, { useState } from 'react';
import './ConfirmationModal.css';

const InputModal = ({ isOpen, onClose, onConfirm, title, message, placeholder, required = false, isDanger = false }) => {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (required && !inputValue.trim()) {
      alert('This field is required!');
      return;
    }
    onConfirm(inputValue);
    setInputValue('');
  };

  const handleClose = () => {
    setInputValue('');
    onClose();
  };

  return (
    <div className="confirmation-modal-overlay">
      <div className="confirmation-modal-content" style={{ borderColor: isDanger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 137, 211, 0.2)' }}>
        <div className="confirmation-modal-header" style={{ background: isDanger ? '#fff1f2' : '#f0f9ff' }}>
          <h3 style={{ color: isDanger ? '#991b1b' : '#0c4a6e' }}>{title || "Input Required"}</h3>
          <button className="close-button" onClick={handleClose}>&times;</button>
        </div>
        <div className="confirmation-modal-body">
          <div className={`modal-icon ${isDanger ? 'warning' : ''}`}>
             {isDanger ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
             ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1089D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
             )}
          </div>
          {message && <p style={{ marginBottom: '16px' }}>{message}</p>}
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder || "Enter value..."}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid rgba(16, 137, 211, 0.2)',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#1089D3'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(16, 137, 211, 0.2)'}
            autoFocus
          />
        </div>
        <div className="confirmation-modal-footer">
          <button className="btn-cancel" onClick={handleClose}>Cancel</button>
          <button 
            className="btn-confirm" 
            onClick={handleConfirm}
            style={{ background: isDanger ? '#ef4444' : '#1089D3', boxShadow: isDanger ? '' : '0 4px 12px rgba(16, 137, 211, 0.3)' }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputModal;
