import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

export const connectSocket = (email) => {
  if (!socket.connected) {
    socket.connect();
  }

  if (email) {
    if (socket.connected) {
      socket.emit('join-room', email);
      console.log(`Socket joining room: ${email}`);
    } else {
      socket.once('connect', () => {
        socket.emit('join-room', email);
        console.log(`Socket connected and joining room: ${email}`);
      });
    }
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log('Socket disconnected');
  }
};

export const subscribeToStatusUpdate = (role, email, callback) => {
  const eventName = role === 'teacher' ? 'teacher-status-updated' : 'student-status-updated';
  socket.on(eventName, (data) => {
    console.log(`Socket received status update for ${role}:`, data);
    callback(data);
  });
  return () => {
    socket.off(eventName, callback);
  };
};

export default socket;
