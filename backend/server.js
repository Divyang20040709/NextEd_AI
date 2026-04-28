const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust as needed for production
        methods: ["GET", "POST", "PATCH", "DELETE"]
    }
});

const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : '*',
  credentials: true
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use('/uploads', express.static('uploads'));

// Set socket.io on app for controller access
app.set('socketio', io);

// Request Logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Database Connection Check Middleware
app.use((req, res, next) => {
    if (mongoose.connection.readyState !== 1 && req.path.startsWith('/api')) {
        return res.status(503).json({ 
            error: "Database not connected", 
            message: "The server is running but cannot connect to MongoDB. Please ensure your MongoDB service is started (run 'mongod')." 
        });
    }
    next();
});

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/NextEd';
console.log(`[DATABASE] Attempting to connect to: ${mongoUri}`);

mongoose.connect(mongoUri)
    .then(() => console.log('✅ Connected to MongoDB: NextEd AI'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('👉 TIP: Ensure your MongoDB service is running (mongod).');
    });

// Socket.io Connection Handle
const vmeetRooms = {};

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Existing generic join-room
    socket.on('join-room', (email) => {
        socket.join(email);
        console.log(`Client ${socket.id} joined room: ${email}`);
    });

    // --- VMEET REAL-TIME EVENTS ---
    
    // Check room info before joining
    socket.on('get-vmeet-info', (roomId) => {
        const room = vmeetRooms[roomId];
        console.log(`[VMEET] Checking room info for ${roomId}. Active Rooms:`, Object.keys(vmeetRooms));
        if (room) {
            console.log(`[VMEET] Room ${roomId} found. Title: ${room.title}`);
            socket.emit('vmeet-info-response', { exists: true, title: room.title });
        } else {
            console.log(`[VMEET] Room ${roomId} not found.`);
            socket.emit('vmeet-info-response', { exists: false });
        }
    });

    // Join a specific meeting room
    socket.on('join-vmeet', ({ roomId, userName, email, meetingTitle }) => {
        if (!vmeetRooms[roomId]) {
            vmeetRooms[roomId] = { 
                participants: [], 
                host: socket.id, 
                waiting: [],
                title: meetingTitle || "Project - Weekly Meeting" 
            };
        }
        
        const room = vmeetRooms[roomId];
        const isHost = room.host === socket.id || room.participants.length === 0;
        
        if (isHost) {
            room.host = socket.id;
            if (meetingTitle) room.title = meetingTitle;
            
            // Session Reconciliation: prevent duplicates
            room.participants = room.participants.filter(p => p.email !== email);
            
            const newUser = { 
                id: socket.id, 
                userName, 
                email, 
                isHost: true, 
                isMicOn: true, 
                isCamOn: true 
            };
            room.participants.push(newUser);
            socket.join(roomId);
            
            socket.emit('vmeet-participants', { 
                participants: room.participants.filter(p => p.id !== socket.id),
                title: room.title
            });
            socket.to(roomId).emit('user-joined', { ...newUser, userName });
            console.log(`Host ${userName} joined Vmeet room: ${roomId} with title: ${room.title}`);
        } else {
            const knocker = { id: socket.id, userName, email };
            room.waiting.push(knocker);
            socket.to(room.host).emit('knocking', knocker);
            socket.emit('waiting-for-approval');
            console.log(`User ${userName} is knocking for room: ${roomId}`);
        }
    });

    socket.on('approve-join', ({ roomId, knockerId }) => {
        const room = vmeetRooms[roomId];
        if (!room || socket.id !== room.host) return;

        const knockerIndex = room.waiting.findIndex(u => u.id === knockerId);
        if (knockerIndex !== -1) {
            const knocker = room.waiting.splice(knockerIndex, 1)[0];
            const newUser = { ...knocker, isHost: false, isMicOn: true, isCamOn: true };
            
            room.participants = room.participants.filter(p => p.email !== newUser.email);
            room.participants.push(newUser);
            
            const knockerSocket = io.sockets.sockets.get(knockerId);
            if (knockerSocket) {
                knockerSocket.join(roomId);
                knockerSocket.emit('join-approved', { 
                    participants: room.participants.filter(p => p.id !== knockerId),
                    title: room.title
                });
                io.to(roomId).emit('user-joined', newUser);
            }
        }
    });

    socket.on('reject-join', ({ roomId, knockerId }) => {
        const room = vmeetRooms[roomId];
        if (!room || socket.id !== room.host) return;

        room.waiting = room.waiting.filter(u => u.id !== knockerId);
        const knockerSocket = io.sockets.sockets.get(knockerId);
        if (knockerSocket) knockerSocket.emit('join-rejected');
    });

    // Handle media status updates (Mic/Cam)
    socket.on('vmeet-status-update', ({ roomId, isMicOn, isCamOn }) => {
        const room = vmeetRooms[roomId];
        if (room) {
            const user = room.participants.find(u => u.id === socket.id);
            if (user) {
                user.isMicOn = isMicOn;
                user.isCamOn = isCamOn;
                socket.to(roomId).emit('vmeet-status-changed', { id: socket.id, isMicOn, isCamOn });
            }
        }
    });

    // Handle explicit leave
    socket.on('leave-vmeet', ({ roomId }) => {
        const room = vmeetRooms[roomId];
        if (!room) return;

        // 1. Check participants
        const pIndex = room.participants.findIndex(u => u.id === socket.id);
        if (pIndex !== -1) {
            const user = room.participants.splice(pIndex, 1)[0];
            socket.to(roomId).emit('user-left', { id: socket.id, userName: user.userName });
            socket.leave(roomId);
            
            if (room.host === socket.id && room.participants.length > 0) {
                room.host = room.participants[0].id;
                room.participants[0].isHost = true;
                io.to(roomId).emit('new-host', { id: room.host, userName: room.participants[0].userName });
            } else if (room.participants.length === 0) {
                delete vmeetRooms[roomId];
            }
        }

        // 2. Check waiting list
        const wIndex = room.waiting.findIndex(u => u.id === socket.id);
        if (wIndex !== -1) {
            room.waiting.splice(wIndex, 1);
            socket.to(room.host).emit('knocker-left', { id: socket.id });
        }
    });

    // Handle WebRTC signaling exchange
    socket.on('vmeet-signal', ({ to, signal, from }) => {
        io.to(to).emit('vmeet-signal', { signal, from });
    });

    socket.on('vmeet-raise-hand', ({ roomId, isRaised }) => {
        socket.to(roomId).emit('vmeet-hand-raised', { id: socket.id, isRaised });
    });

    // Handle room chat
    socket.on('vmeet-message', ({ roomId, message, userName }) => {
        io.to(roomId).emit('vmeet-message', { 
            id: Date.now(), 
            user: userName, 
            text: message, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        // Cleanup Vmeet rooms on disconnect
        for (const roomId in vmeetRooms) {
            const room = vmeetRooms[roomId];
            
            // 1. Check participants
            const pIndex = room.participants.findIndex(u => u.id === socket.id);
            if (pIndex !== -1) {
                const user = room.participants.splice(pIndex, 1)[0];
                // Broadcast user-left with name for system messages
                socket.to(roomId).emit('user-left', { id: socket.id, userName: user.userName });
                console.log(`User ${user.userName} left Vmeet room: ${roomId}`);
                
                // If host left, assign new host
                if (room.host === socket.id && room.participants.length > 0) {
                    room.host = room.participants[0].id;
                    room.participants[0].isHost = true;
                    io.to(roomId).emit('new-host', { id: room.host, userName: room.participants[0].userName });
                } else if (room.participants.length === 0) {
                    delete vmeetRooms[roomId];
                }
                break;
            }

            // 2. Check waiting list
            const wIndex = room.waiting.findIndex(u => u.id === socket.id);
            if (wIndex !== -1) {
                room.waiting.splice(wIndex, 1);
                // Notify host that knocker has left
                socket.to(room.host).emit('knocker-left', { id: socket.id });
                console.log(`Knocker ${socket.id} disconnected from waiting room ${roomId}`);
                break;
            }
        }
    });
});

const chatRoutes = require('./routes/chat');
const chatbotRoutes = require('./routes/chatbot');
const knowledgeRoutes = require('./routes/knowledge');
const aitutorRoutes = require('./routes/aitutor');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const classroomRoutes = require('./routes/classroom');
const teacherRoutes = require('./routes/teacher');
const postRoutes = require('./routes/post');
const examRoutes = require('./routes/examRoutes');
const submissionRoutes = require('./routes/submission');

app.use('/api/chat', chatRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/aitutor', aitutorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/classroom', classroomRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/post', postRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/submission', submissionRoutes);
app.use('/api', chatbotRoutes);

server.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`API reachable at http://127.0.0.1:${port}/api`);
});
