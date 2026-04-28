import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket, connectSocket } from '../../utils/socket';
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal';
import { notifyAuthChange } from '../../utils/api';

/**
 * GlobalAuthHandler - Mounted once in App.jsx.
 * Owns the ban/delete popup + redirect flow.
 * Navbar only handles: approved (red dot), rejected (navigate signup).
 * This component handles: banned (popup → login), deleted (popup → signup).
 */
const GlobalAuthHandler = () => {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: null 
  });

  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    const pendingStr = localStorage.getItem('pending_signup');

    // Get email from either user_data (logged-in/banned) or pending_signup
    let email = '';
    let userData = null;

    if (userDataStr) {
      try {
        userData = JSON.parse(userDataStr);
        email = userData.email;
      } catch { /* ignore */ }
    } else if (pendingStr) {
      try {
        email = JSON.parse(pendingStr).email;
      } catch { /* ignore */ }
    }

    if (!email) return;

    // Admins are never targeted by these events
    if (userData?.role === 'admin') return;

    // Connect socket to the user's email room
    if (!socket.connected) {
      connectSocket(email);
    } else {
      socket.emit('join-room', email);
    }

    const handleStatusUpdate = (data) => {
      console.log('GlobalAuthHandler: received status:', data.status);

      if (data.status === 'banned') {
        // ── BAN FLOW ──
        // Show popup → user clicks OK → mark isLoggedIn:false → redirect to /login
        // Data is kept in localStorage so user can see the banned error on login
        setConfirm({
          isOpen: true,
          title: '🚫 Account Suspended',
          message: data.message || 'Your account has been suspended by an admin. Contact the admin to restore access.',
          onConfirm: () => {
            // Mark isLoggedIn: false — data stays so login page shows the banned error
            const storedData = localStorage.getItem('user_data');
            if (storedData) {
              try {
                const parsed = JSON.parse(storedData);
                parsed.isLoggedIn = false;
                localStorage.setItem('user_data', JSON.stringify(parsed));
              } catch { /* ignore */ }
            }
            localStorage.removeItem('has_approval_update');
            notifyAuthChange();
            setConfirm(prev => ({ ...prev, isOpen: false }));
            navigate('/login');
          }
        });

      } else if (data.status === 'deleted') {
        // ── DELETE FLOW ──
        // Show popup → user clicks OK → clear ALL data → redirect to /signup
        setConfirm({
          isOpen: true,
          title: '⚠️ Account Deleted',
          message: data.message || 'Your account has been permanently deleted by an admin.',
          onConfirm: () => {
            localStorage.removeItem('user_data');
            localStorage.removeItem('student_token');
            localStorage.removeItem('teacher_token');
            localStorage.removeItem('has_approval_update');
            localStorage.removeItem('pending_signup');
            notifyAuthChange();
            setConfirm(prev => ({ ...prev, isOpen: false }));
            navigate('/signup');
          }
        });
      }
      // 'approved' and 'rejected' are handled by Navbar
    };

    socket.on('teacher-status-updated', handleStatusUpdate);
    socket.on('student-status-updated', handleStatusUpdate);

    return () => {
      socket.off('teacher-status-updated', handleStatusUpdate);
      socket.off('student-status-updated', handleStatusUpdate);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ConfirmationModal
      isOpen={confirm.isOpen}
      onClose={() => {
        // Closing without confirming = same as confirming (we force the action)
        if (confirm.onConfirm) confirm.onConfirm();
      }}
      onConfirm={confirm.onConfirm}
      title={confirm.title}
      message={confirm.message}
      confirmText="I Understand"
      isDanger={true}
    />
  );
};

export default GlobalAuthHandler;
