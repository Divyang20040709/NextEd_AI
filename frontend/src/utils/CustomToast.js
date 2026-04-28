/**
 * CustomToast Utility
 * A premium, lightweight toast notification system.
 * Usage: showToast("Message", "success" | "error" | "ban" | "delete" | "info");
 */

import './CustomToast.css';

const icons = {
  success: `<svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" stroke-width="1.5" fill="rgba(34, 197, 94, 0.1)"></circle><polyline points="8 12.5 10.5 15 16 9"></polyline></svg>`,
  error: `<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" stroke-width="1.5" fill="rgba(239, 68, 68, 0.1)"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
  ban: `<svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" stroke-width="1.5" fill="rgba(245, 158, 11, 0.1)"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`,
  delete: `<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="#1089D3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" stroke-width="1.5" fill="rgba(16, 137, 211, 0.1)"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  pending: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>`
};

export const showToast = (message, type = 'info') => {
  // Remove existing toasts of same type to prevent stacking (optional)
  // document.querySelectorAll(`.custom-toast.${type}`).forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `custom-toast ${type}`;
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-message">${message}</div>
  `;

  document.body.appendChild(toast);

  // Auto remove after animation
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
};

export default showToast;
