import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket, connectSocket } from '../../utils/socket';
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal';
import './VmeetRoom.css';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

const KingIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="king-svg"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"></path><path d="M12 21h-7l1.5-5h11l1.5 5h-7z"></path></svg>
);

const PhoneIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="leave-svg">
        <path d="M10.68 13.31a16 16 0 0 0 3.41 2.21l.61-.19a1.85 1.85 0 0 1 2.15 1.13l.63 1.19a1.85 1.85 0 0 1-.22 2.15l-1.39 1.39a1.85 1.85 0 0 1-2 .41 16 16 0 0 1-11-11 1.85 1.85 0 0 1 .41-2l1.39-1.39a1.85 1.85 0 0 1 2.15-.22l1.19.63a1.85 1.85 0 0 1 1.13 2.15l-.19.61a15.42 15.42 0 0 0 2.21 3.41z"></path>
        <line x1="23" y1="1" x2="1" y2="23" stroke="#fff" strokeWidth="3"></line>
    </svg>
);

const EnhancedLeaveIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 12H9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const SpeakerWavy = () => (
    <div className="speaker-wavy">
        <span></span><span></span><span></span>
    </div>
);

const VmeetRoom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    
    const [user, setUser] = useState(() => {
        const userDataStr = localStorage.getItem('user_data');
        if (userDataStr) {
            try {
                const parsed = JSON.parse(userDataStr);
                return { 
                    name: parsed.name || parsed.username || 'User', 
                    email: parsed.email 
                };
            } catch (e) {
                console.error("Error parsing user data", e);
            }
        }
        return { name: 'Guest', email: `guest_${Math.floor(Math.random() * 1000)}@nexted.ai` };
    });

    const [isPreJoin, setIsPreJoin] = useState(true);
    const [meetingTitle, setMeetingTitle] = useState('Project - Weekly Meeting');
    const [tempMic, setTempMic] = useState(true);
    const [tempCam, setTempCam] = useState(true);
    const [roomExists, setRoomExists] = useState(null);
    const [camStreamAcquired, setCamStreamAcquired] = useState(false);

    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);
    const [activeSidebar, setActiveSidebar] = useState('participants'); 
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [unreadChat, setUnreadChat] = useState(false);
    const [participants, setParticipants] = useState([]); // Array of { id, userName, email, isHost, isMicOn, isCamOn, hasRaisedHand, stream }
    const [isHost, setIsHost] = useState(false);

    const localStreamRef = useRef(null);
    const localVideoRef = useRef(null);
    const preJoinVideoRef = useRef(null);
    const peerConnections = useRef({}); // { socketId: RTCPeerConnection }
    const streamsMap = useRef({}); // { socketId: MediaStream }
    const [activeSpeakerId, setActiveSpeakerId] = useState(null); // ID of pinned participant, null for self

    const [isWaiting, setIsWaiting] = useState(false);
    const [isRejected, setIsRejected] = useState(false);
    const [knockingRequests, setKnockingRequests] = useState([]);
    
    // Phase 4 New States
    const [hasRaisedHand, setHasRaisedHand] = useState(false);
    const [customAlert, setCustomAlert] = useState(null); 
    const [isConfirmingLeave, setIsConfirmingLeave] = useState(false);
    const hasJoinedRef = useRef(false);
    const isSidebarOpenRef = useRef(isSidebarOpen);
    const activeSidebarRef = useRef(activeSidebar);

    useEffect(() => {
        isSidebarOpenRef.current = isSidebarOpen;
    }, [isSidebarOpen]);

    useEffect(() => {
        activeSidebarRef.current = activeSidebar;
    }, [activeSidebar]);

    useEffect(() => {
        const handleResize = () => {
            const desktop = window.innerWidth > 1024;
            setIsDesktop(desktop);
            if (desktop) {
                setIsSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const initMedia = useCallback(async () => {
        if (localStreamRef.current) return localStreamRef.current;
        
        try {
            console.log("Initializing media devices...");
            const constraints = { 
                video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } }, 
                audio: true 
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;
            setCamStreamAcquired(true);
            
            if (localVideoRef.current && localVideoRef.current.srcObject !== stream) {
                localVideoRef.current.srcObject = stream;
            }
            
            // Critical: Add tracks to all existing peer connections
            Object.values(peerConnections.current).forEach(pc => {
                stream.getTracks().forEach(track => {
                    const senders = pc.getSenders();
                    const alreadyAdded = senders.some(s => s.track === track);
                    if (!alreadyAdded) {
                        pc.addTrack(track, stream);
                    }
                });
            });
            
            return stream;
        } catch (err) {
            console.error("Error accessing media devices.", err);
            setIsCamOn(false);
            setIsMicOn(false);
            if (socket.connected && roomId) {
                socket.emit('vmeet-status-update', { roomId, isMicOn: false, isCamOn: false });
            }
        }
    }, [roomId]);

    const createPeerConnection = useCallback((targetSocketId, isInitiator) => {
        if (peerConnections.current[targetSocketId]) return peerConnections.current[targetSocketId];

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnections.current[targetSocketId] = pc;

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('vmeet-signal', { 
                    to: targetSocketId, 
                    from: socket.id, 
                    signal: { candidate: event.candidate } 
                });
            }
        };

        pc.ontrack = (event) => {
            console.log("OnTrack fired for", targetSocketId, event.track.kind);
            
            // Use streamsMap as the immediate source of truth to avoid race conditions
            if (!streamsMap.current[targetSocketId]) {
                streamsMap.current[targetSocketId] = new MediaStream();
            }
            
            const stream = streamsMap.current[targetSocketId];
            if (!stream.getTracks().find(t => t.id === event.track.id)) {
                stream.addTrack(event.track);
            }

            setParticipants(prev => {
                const participant = prev.find(p => p.id === targetSocketId);
                // Return a new object to ensure React notices the state change
                return prev.map(p => 
                    p.id === targetSocketId ? { ...p, stream: stream } : p
                );
            });
        };

        if (isInitiator) {
            pc.onnegotiationneeded = async () => {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit('vmeet-signal', { 
                        to: targetSocketId, 
                        from: socket.id, 
                        signal: { offer } 
                    });
                } catch (err) {
                    console.error("Error creating offer", err);
                }
            };
        }

        return pc;
    }, []);

    const addSystemMessage = useCallback((text, type = 'info') => {
        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'system',
            text,
            color: type === 'join' ? '#22c55e' : type === 'leave' ? '#ef4444' : '#64748b'
        }]);
    }, []);

    useEffect(() => {
        const currentPCs = peerConnections.current;

        if (!socket.connected) {
            console.log("[VMEET] Socket not connected, connecting...");
            connectSocket(user.email);
        }

        const fetchRoomInfo = () => {
            console.log(`[VMEET] Fetching room info for ${roomId}...`);
            socket.emit('get-vmeet-info', roomId);
        };

        if (socket.connected) {
            fetchRoomInfo();
        } else {
            socket.on('connect', fetchRoomInfo);
        }

        socket.on('vmeet-info-response', ({ exists, title }) => {
            console.log(`[VMEET] Received room info: exists=${exists}, title=${title}`);
            setRoomExists(exists);
            if (exists && title) {
                setMeetingTitle(title);
            }
        });

        socket.on('waiting-for-approval', () => setIsWaiting(true));
        socket.on('join-rejected', () => { setIsWaiting(false); setIsRejected(true); });
        
        socket.on('knocking', (knocker) => {
            setKnockingRequests(prev => {
                if (prev.find(req => req.id === knocker.id)) return prev;
                return [...prev, knocker];
            });
        });

        socket.on('knocker-left', ({ id }) => {
            setKnockingRequests(prev => prev.filter(req => req.id !== id));
        });

        socket.on('join-approved', ({ participants: pList, title }) => {
            console.log("Join approved - initializing meeting");
            setIsWaiting(false);
            if (title) setMeetingTitle(title);
            const others = pList.filter(u => u.id !== socket.id);
            setParticipants(others.map(u => ({
                ...u,
                isMicOn: u.isMicOn ?? true,
                isCamOn: u.isCamOn ?? true,
                hasRaisedHand: u.hasRaisedHand ?? false,
                stream: streamsMap.current[u.id] || null
            })));
            others.forEach(u => createPeerConnection(u.id, true));
            addSystemMessage('You joined the meeting', 'join');
            if (!localStreamRef.current) initMedia();
        });

        socket.on('vmeet-message', (msg) => {
            setMessages(prev => [...prev, msg]);
            if (activeSidebarRef.current !== 'chat' || !isSidebarOpenRef.current) {
                setUnreadChat(true);
            }
        });

        socket.on('vmeet-participants', ({ participants: pList, title }) => {
            // This event is only sent to the host when they join.
            if (title) setMeetingTitle(title);
            const others = pList.filter(u => u.id !== socket.id);
            setIsHost(true);
            setParticipants(others.map(u => ({
                ...u,
                isMicOn: u.isMicOn ?? true,
                isCamOn: u.isCamOn ?? true,
                hasRaisedHand: u.hasRaisedHand ?? false,
                stream: streamsMap.current[u.id] || null
            })));
            others.forEach(u => createPeerConnection(u.id, true));
        });

        socket.on('user-joined', (newUser) => {
            if (newUser.id === socket.id) {
                if (newUser.isHost) setIsHost(true);
                return;
            }
            // Clear from knocking requests if they were waiting
            setKnockingRequests(prev => prev.filter(req => req.id !== newUser.id));
            
            setParticipants(prev => {
                if (prev.find(u => u.id === newUser.id)) return prev;
                addSystemMessage(`${newUser.userName} joined the meeting`, 'join');
                return [...prev, { 
                    ...newUser, 
                    isMicOn: newUser.isMicOn ?? true,
                    isCamOn: newUser.isCamOn ?? true,
                    stream: streamsMap.current[newUser.id] || null 
                }];
            });
            // New participant should initiate, existing ones wait
            createPeerConnection(newUser.id, false);
        });

        socket.on('user-left', ({ id, userName }) => {
            setParticipants(prev => prev.filter(u => u.id !== id));
            if (currentPCs[id]) {
                currentPCs[id].close();
                delete currentPCs[id];
            }
            delete streamsMap.current[id];
            addSystemMessage(`${userName} left the meeting`, 'leave');
            
            // Use functional update to avoid stale closure of activeSpeakerId
            setActiveSpeakerId(prev => (prev === id ? null : prev));
        });

        socket.on('new-host', ({ id, userName }) => {
            if (id === socket.id) {
                setIsHost(true);
                addSystemMessage('You are now the moderator', 'info');
            } else {
                setParticipants(prev => prev.map(p => ({ ...p, isHost: p.id === id })));
                addSystemMessage(`${userName} is now the moderator`, 'info');
            }
        });

        socket.on('vmeet-status-changed', ({ id, isMicOn, isCamOn }) => {
            setParticipants(prev => prev.map(p => 
                p.id === id ? { ...p, isMicOn, isCamOn } : p
            ));
        });

        socket.on('vmeet-hand-raised', ({ id, isRaised }) => {
            setParticipants(prev => prev.map(p => 
                p.id === id ? { ...p, hasRaisedHand: isRaised } : p
            ));
        });

        socket.on('vmeet-signal', async ({ signal, from }) => {
            const pc_ref = peerConnections.current;
            let pc = pc_ref[from];
            if (!pc) pc = createPeerConnection(from, false);

            try {
                if (signal.offer) {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.emit('vmeet-signal', { to: from, from: socket.id, signal: { answer } });
                } else if (signal.answer) {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
                } else if (signal.candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                }
            } catch (err) {
                console.error("Signal Handling Error:", err);
            }
        });


        return () => {
            socket.off('waiting-for-approval');
            socket.off('join-rejected');
            socket.off('knocker-left');
            socket.off('join-approved');
            socket.off('knocking');
            socket.off('vmeet-message');
            socket.off('vmeet-participants');
            socket.off('user-joined');
            socket.off('user-left');
            socket.off('new-host');
            socket.off('vmeet-signal');
            socket.off('vmeet-status-changed');
            socket.off('vmeet-hand-raised');
            socket.off('vmeet-info-response');
        };
    }, [roomId, user.email, user.name, createPeerConnection, addSystemMessage]);

    // Dedicated Join Effect
    useEffect(() => {
        if (!isPreJoin && !hasJoinedRef.current && socket.connected) {
            console.log("[VMEET] Emitting join-vmeet from effect");
            socket.emit('join-vmeet', { 
                roomId, 
                userName: user.name, 
                email: user.email,
                meetingTitle: meetingTitle
            });
            hasJoinedRef.current = true;
        }
    }, [isPreJoin, roomId, user.name, user.email, meetingTitle]);

    // Final Unmount Cleanup
    useEffect(() => {
        return () => {
            console.log("[VMEET] Component unmounting - stopping all tracks");
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
                localStreamRef.current = null;
            }
            Object.values(peerConnections.current).forEach(pc => pc.close());
            peerConnections.current = {};
        };
    }, []);

    useEffect(() => {
        if (isPreJoin && preJoinVideoRef.current && localStreamRef.current) {
            if (preJoinVideoRef.current.srcObject !== localStreamRef.current) {
                console.log("[VMEET] Syncing pre-join video stream");
                preJoinVideoRef.current.srcObject = localStreamRef.current;
            }
        }
    }, [isPreJoin, tempCam, camStreamAcquired]); // Re-run when camera is toggled, pre-join mounts, or stream is acquired

    useEffect(() => {
        if (!isWaiting && !isRejected && !localStreamRef.current) {
            initMedia();
        }
    }, [isWaiting, isRejected, initMedia]);

    const handleLeave = () => {
        setIsConfirmingLeave(true);
    };

    const confirmLeave = () => {
        socket.emit('leave-vmeet', { roomId });
        navigate('/vmeet');
    };

    const cancelJoin = () => {
        socket.emit('leave-vmeet', { roomId });
        navigate('/vmeet');
    };

    const sendMessage = () => {
        if (newMessage.trim()) {
            socket.emit('vmeet-message', { roomId, message: newMessage, userName: user.name });
            setNewMessage('');
        }
    };

    const toggleRaiseHand = () => {
        const newState = !hasRaisedHand;
        setHasRaisedHand(newState);
        socket.emit('vmeet-raise-hand', { roomId, isRaised: newState });
    };

    const showModalAlert = (title, message, type = 'info') => {
        setCustomAlert({ title, message, type });
    };

    const toggleMic = () => {
        const newState = !isMicOn;

        // If we have an actual audio track, enable/disable it
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = newState;
            }
        }

        // Always update local state + inform room, even if there is no media stream
        setIsMicOn(newState);
        socket.emit('vmeet-status-update', { roomId, isMicOn: newState, isCamOn });
    };

    const toggleCam = () => {
        const newState = !isCamOn;

        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = newState;
            }

            // Extra fix for Edge/Main View duplication: Refresh local video ref
            if (newState && localVideoRef.current) {
                localVideoRef.current.srcObject = localStreamRef.current;
            }
        }

        // Even if no stream (e.g. media permission denied), reflect logical camera state in the room
        setIsCamOn(newState);
        socket.emit('vmeet-status-update', { roomId, isMicOn, isCamOn: newState });
    };

    const handleSidebarToggle = () => {
        const nextState = !isSidebarOpen;
        setIsSidebarOpen(nextState);
        if (nextState && activeSidebar === 'chat') {
            setUnreadChat(false);
        }
    };

    const copyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        showModalAlert('Success', `Room ID ${roomId} copied to clipboard!`, 'success');
    };

    const approveKnocker = (knockerId) => {
        socket.emit('approve-join', { roomId, knockerId });
        setKnockingRequests(prev => prev.filter(req => req.id !== knockerId));
    };

    const rejectKnocker = (knockerId) => {
        socket.emit('reject-join', { roomId, knockerId });
        setKnockingRequests(prev => prev.filter(req => req.id !== knockerId));
    };

    if (isRejected) {
        return (
            <div className="vmeet-waiting-room">
                <div className="waiting-card">
                    <h2>Meeting request denied</h2>
                    <p>The host did not allow you to join this meeting.</p>
                    <button className="back-btn-large" onClick={() => navigate('/vmeet')}>Return to Home</button>
                </div>
            </div>
        );
    }

    if (isWaiting) {
        return (
            <div className="vmeet-waiting-room">
                <div className="waiting-card">
                    <div className="pulse-loader"></div>
                    <h2>Asking to join...</h2>
                    <p>You'll join the meeting when someone lets you in.</p>
                    <button className="cancel-join-btn" onClick={cancelJoin}>Cancel</button>
                </div>
            </div>
        );
    }

    if (isPreJoin) {
        return (
            <div className="vmeet-prejoin-root">
                <div className="prejoin-container">
                    <div className="prejoin-preview-section">
                        <div className="preview-video-box">
                            {tempCam ? (
                                <video 
                                    ref={preJoinVideoRef}
                                    autoPlay 
                                    muted 
                                    playsInline 
                                    className="preview-video" 
                                />
                            ) : (
                                <div className="preview-off-overlay">
                                    <div className="avatar-preview">
                                        <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=1089d3&size=128`} alt="User" />
                                    </div>
                                    <p>Camera is off</p>
                                </div>
                            )}
                            <div className="preview-controls">
                                <button className={`control-btn-pre ${!tempMic ? 'off' : ''}`} onClick={() => setTempMic(!tempMic)}>
                                    {tempMic ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="3" x2="21" y2="21"></line><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path></svg>}
                                </button>
                                <button className={`control-btn-pre ${!tempCam ? 'off' : ''}`} onClick={() => setTempCam(!tempCam)}>
                                    {tempCam ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect><line x1="1" y1="1" x2="23" y2="23"></line></svg>}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="prejoin-form-section">
                        <div className="form-card-vmeet">
                            <h2>Ready to join?</h2>
                            <p className="subtitle">Check your audio and video before you enter.</p>
                            
                            <div className="vmeet-form-inputs">
                                <div className="input-group-vmeet">
                                    <label>Your Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter your name"
                                        value={user.name}
                                        onChange={(e) => setUser({...user, name: e.target.value})}
                                    />
                                </div>
                                {roomExists === false && (
                                    <div className="input-group-vmeet">
                                        <label>Meeting Title</label>
                                        <input 
                                            type="text" 
                                            placeholder="Enter meeting title"
                                            value={meetingTitle}
                                            onChange={(e) => setMeetingTitle(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <button 
                                className="start-meeting-btn" 
                                disabled={roomExists === null}
                                onClick={() => {
                                    if (!user.name.trim()) return alert("Please enter your name");
                                    setIsMicOn(tempMic);
                                    setIsCamOn(tempCam);
                                    // Apply media states to tracks
                                    if (localStreamRef.current) {
                                        const audioTrack = localStreamRef.current.getAudioTracks()[0];
                                        const videoTrack = localStreamRef.current.getVideoTracks()[0];
                                        if (audioTrack) audioTrack.enabled = tempMic;
                                        if (videoTrack) videoTrack.enabled = tempCam;
                                    }
                                    setIsPreJoin(false);
                                }}
                            >
                                {roomExists === null ? 'Checking room...' : roomExists ? 'Ask to join' : 'Start Meeting'}
                            </button>
                            
                            {roomExists && (
                                <p className="room-info-text">
                                    Joining: <strong>{meetingTitle}</strong>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const galleryParticipants = participants.filter(p => !activeSpeakerId || p.id !== activeSpeakerId);
    const showSelfInGallery = (activeSpeakerId !== null);
    const speakerData = activeSpeakerId ? participants.find(p => p.id === activeSpeakerId) : null;

    return (
        <div className="vmeet-room-inner">
            <header className="room-header">
                <div className="header-left">
                    <img src="/Logo.jpg" alt="Logo" className="room-logo" />
                </div>
                
                <div className="header-center">
                    <div className="meeting-title-pill">
                        <button className="back-btn" onClick={handleLeave}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                        <div className="title-info">
                            <h2>{meetingTitle}</h2>
                            <span>NextEd Room: {roomId}</span>
                        </div>
                        
                        <div className="header-controls">
                            <button className={`control-btn-small ${!isMicOn ? 'off' : ''}`} onClick={toggleMic}>
                                {isMicOn ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="3" y1="3" x2="21" y2="21"></line></svg>}
                            </button>
                            <button className={`control-btn-small ${!isCamOn ? 'off' : ''}`} onClick={toggleCam}>
                                {isCamOn ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect><line x1="1" y1="1" x2="23" y2="23"></line></svg>}
                            </button>
                             <button className="control-btn-small end-call" onClick={handleLeave}>
                                <EnhancedLeaveIcon />
                            </button>
                             <button className={`control-btn-small more-options ${isSidebarOpen ? 'active' : ''}`} style={{ position: 'relative', display: isDesktop ? 'none' : 'flex' }} onClick={handleSidebarToggle}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1.5"></circle><circle cx="19" cy="12" r="1.5"></circle><circle cx="5" cy="12" r="1.5"></circle></svg>
                                {unreadChat && <span className="unread-dot"></span>}
                            </button>
                            <button className="control-btn-small raise-hand" onClick={toggleRaiseHand} style={{ color: hasRaisedHand ? '#FBBF24' : 'inherit' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill={hasRaisedHand ? '#FBBF24' : 'none'} stroke="currentColor" strokeWidth="2.5"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5"></path><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v10"></path><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="header-right">
                    <button className="copy-link-btn" onClick={copyRoomId}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        Copy code
                    </button>
                    <div className="user-avatar-small">
                        <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=1089d3&color=fff`} alt="User" />
                    </div>
                </div>
            </header>

            <main className="room-main">
                <div className="main-content-layout">
                    <div className="active-speaker-container">
                        <div className="video-placeholder">
                            {!speakerData ? (
                                isCamOn ? (
                                     <video 
                                        ref={el => {
                                            if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) {
                                                el.srcObject = localStreamRef.current;
                                            }
                                            localVideoRef.current = el;
                                        }}
                                        autoPlay 
                                        muted 
                                        playsInline 
                                        className="main-video-feed" 
                                    />
                                ) : (
                                    <div className="camera-off-overlay">
                                        <div className="avatar-large">
                                            <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=1089d3&size=128`} alt="User" />
                                        </div>
                                        <p>Camera is off</p>
                                    </div>
                                )
                            ) : (
                                speakerData.stream && speakerData.isCamOn !== false ? (
                                     <video 
                                        autoPlay 
                                        playsInline 
                                        className="main-video-feed"
                                        ref={el => { if (el && speakerData.stream && el.srcObject !== speakerData.stream) el.srcObject = speakerData.stream; }}
                                    />
                                ) : (
                                    <div className="camera-off-overlay">
                                        <div className="avatar-large">
                                            <img src={`https://ui-avatars.com/api/?name=${speakerData.userName}&background=random&size=128`} alt={speakerData.userName} />
                                        </div>
                                        <p>{speakerData.userName}'s camera is off</p>
                                    </div>
                                )
                            )}
                            <div className="speaker-tag">
                                {((!speakerData && isHost) || (speakerData && speakerData.isHost)) && <KingIcon />}
                                <span className="speaker-name-text">
                                    {!speakerData ? `You (${user?.name})` : speakerData.userName}
                                </span>
                                {(!speakerData ? isMicOn : speakerData.isMicOn) && <SpeakerWavy />}
                                {(!speakerData ? hasRaisedHand : speakerData.hasRaisedHand) && <span style={{ marginLeft: '8px' }}>✋</span>}
                            </div>
                        </div>
                    </div>

                    <div className="vertical-gallery">
                        {showSelfInGallery && (
                            <div 
                                className={`gallery-card-vertical ${!activeSpeakerId ? 'active-pin' : ''}`}
                                onClick={() => setActiveSpeakerId(null)}
                            >
                                {isCamOn ? (
                                    <video 
                                        autoPlay 
                                        muted 
                                        playsInline 
                                        className="gallery-video-feed"
                                        ref={el => { if (el && localStreamRef.current && el.srcObject !== localStreamRef.current) el.srcObject = localStreamRef.current; }}
                                    />
                                ) : (
                                    <div className="gallery-placeholder">
                                        <div className="avatar-small">
                                            <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=1089d3&size=48`} alt="User" />
                                        </div>
                                    </div>
                                )}
                                <div className="mini-name-tag">
                                    {isHost && <KingIcon />}
                                    {user?.name?.split(' ')[0] || 'You'}
                                </div>
                                <div className="participant-icons">
                                    {hasRaisedHand && <span className="icon-badge yellow">✋</span>}
                                    <span className={`icon-badge-small ${isMicOn ? 'green' : 'red'}`}>
                                        {isMicOn ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path></svg> : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path></svg>}
                                    </span>
                                    <span className={`icon-badge-small ${isCamOn ? 'green' : 'red'}`}>
                                        {isCamOn ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg> : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect><line x1="1" y1="1" x2="23" y2="23"></line></svg>}
                                    </span>
                                </div>
                            </div>
                        )}
                        {galleryParticipants.map(p => (
                            <div 
                                key={p.id} 
                                className={`gallery-card-vertical ${activeSpeakerId === p.id ? 'active-pin' : ''}`}
                                onClick={() => setActiveSpeakerId(p.id)}
                            >
                                {p.stream && p.isCamOn ? (
                                    <video 
                                        autoPlay 
                                        playsInline 
                                        className="gallery-video-feed"
                                        ref={el => { if (el && p.stream && el.srcObject !== p.stream) el.srcObject = p.stream; }}
                                    />
                                ) : (
                                    <div className="gallery-placeholder">
                                        <div className="avatar-small">
                                            <img src={`https://ui-avatars.com/api/?name=${p.userName}&background=random&size=48`} alt={p.userName} />
                                        </div>
                                    </div>
                                )}
                                <div className="mini-name-tag">
                                    {p.isHost && <KingIcon />}
                                    {p.userName.split(' ')[0]}
                                </div>
                                <div className="participant-icons">
                                    {p.hasRaisedHand && <span className="icon-badge yellow">✋</span>}
                                    <span className={`icon-badge-small ${p.isMicOn ? 'green' : 'red'}`}>
                                        {p.isMicOn ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path></svg> : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path></svg>}
                                    </span>
                                    <span className={`icon-badge-small ${p.isCamOn ? 'green' : 'red'}`}>
                                        {p.isCamOn ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg> : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect><line x1="1" y1="1" x2="23" y2="23"></line></svg>}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {isSidebarOpen && (
                    <aside className="room-sidebar">
                        <div className="vmeet-sidebar-tabs">
                            <button 
                                className={`vmeet-tab-btn ${activeSidebar === 'participants' ? 'active' : ''}`}
                                onClick={() => setActiveSidebar('participants')}
                            >
                                Participants <span className="count">{participants.length + 1}</span>
                            </button>
                            <button 
                                className={`vmeet-tab-btn ${activeSidebar === 'chat' ? 'active' : ''}`}
                                onClick={() => { setActiveSidebar('chat'); setUnreadChat(false); }}
                            >
                                Chat {unreadChat && activeSidebar !== 'chat' && <span className="unread-dot-small"></span>}
                            </button>
                        </div>

                        <div className="vmeet-sidebar-content">
                            {activeSidebar === 'participants' ? (
                                <div className="participants-list">
                                    {isHost && knockingRequests.length > 0 && (
                                        <div className="sidebar-requests-section">
                                            <h4 className="sidebar-section-title">Waiting to join</h4>
                                            {knockingRequests.map(req => (
                                                <div key={req.id} className="request-row-sidebar">
                                                    <div className="request-user">
                                                        <img src={`https://ui-avatars.com/api/?name=${req.userName}&background=random`} alt="User" />
                                                        <span className="req-name">{req.userName}</span>
                                                    </div>
                                                    <div className="request-actions">
                                                        <button className="sidebar-reject-btn" onClick={() => rejectKnocker(req.id)}>Reject</button>
                                                        <button className="sidebar-approve-btn" onClick={() => approveKnocker(req.id)}>Approve</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <h4 className="sidebar-section-title">In call</h4>
                                    <div className="vmeet-participant-row">
                                        <div className="participant-avatar-wrapper">
                                            <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=1089d3&color=fff`} alt="User" />
                                            {isHost && <div className="avatar-badge-crown"><KingIcon /></div>}
                                        </div>
                                        <div className="user-info">
                                            <span className="name">{user?.name} (You)</span>
                                            <span className="role">{isHost ? 'Host' : 'Participant'}</span>
                                        </div>
                                        <div className="sidebar-status-icons">
                                            {hasRaisedHand && <span className="sidebar-indicator-pill yellow" title="Hand Raised">✋</span>}
                                            {isMicOn ? <SpeakerWavy /> : <span className="sidebar-indicator-pill red" title="Microphone Off"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path></svg></span>}
                                            {isCamOn ? <span className="sidebar-indicator-pill green" title="Camera On"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg></span> : <span className="sidebar-indicator-pill red" title="Camera Off"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect><line x1="1" y1="1" x2="23" y2="23"></line></svg></span>}
                                        </div>
                                    </div>
                                    {participants.map(p => (
                                        <div key={p.id} className="vmeet-participant-row">
                                            <div className="participant-avatar-wrapper">
                                                <img src={`https://ui-avatars.com/api/?name=${p.userName}&background=random`} alt={p.userName} />
                                                {p.isHost && <div className="avatar-badge-crown"><KingIcon /></div>}
                                            </div>
                                            <div className="user-info">
                                                <span className="name">{p.userName}</span>
                                                <span className="role">{p.isHost ? 'Host' : 'Participant'}</span>
                                            </div>
                                            <div className="sidebar-status-icons">
                                                {p.hasRaisedHand && <span className="sidebar-indicator-pill yellow" title="Hand Raised">✋</span>}
                                                {p.isMicOn ? <SpeakerWavy /> : <span className="sidebar-indicator-pill red" title="Microphone Off"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path></svg></span>}
                                                {p.isCamOn ? <span className="sidebar-indicator-pill green" title="Camera On"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg></span> : <span className="sidebar-indicator-pill red" title="Camera Off"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect><line x1="1" y1="1" x2="23" y2="23"></line></svg></span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="chat-container">
                                    <div className="messages-list">
                                        {messages.map(msg => (
                                            msg.type === 'system' ? (
                                                <div key={msg.id} className="system-message" style={{ color: msg.color }}>
                                                    {msg.text}
                                                </div>
                                            ) : (
                                                <div key={msg.id} className={`chat-message ${msg.user === user?.name ? 'mine' : ''}`}>
                                                    <span className="sender">{msg.user}</span>
                                                    <p className="text">{msg.text}</p>
                                                    <span className="chat-time">{msg.time}</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                    <div className="chat-input-area">
                                        <div className="input-with-icon">
                                            <input type="text" placeholder="Send a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} />
                                            <button className="send-msg-btn" onClick={sendMessage}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                )}

                {customAlert && (
                    <div className="custom-alert-overlay">
                        <div className={`custom-alert-card ${customAlert.type}`}>
                            <div className="alert-header">
                                <h3>{customAlert.title}</h3>
                                <button className="close-alert" onClick={() => setCustomAlert(null)}>&times;</button>
                            </div>
                            <div className="alert-body">
                                <p>{customAlert.message}</p>
                            </div>
                            <div className="alert-footer">
                                <button className="alert-ok-btn" onClick={() => setCustomAlert(null)}>Okay</button>
                            </div>
                        </div>
                    </div>
                )}

                <ConfirmationModal 
                    isOpen={isConfirmingLeave}
                    onClose={() => setIsConfirmingLeave(false)}
                    onConfirm={confirmLeave}
                    title="Leave Meeting"
                    message="Are you sure you want to leave the meeting?"
                    confirmText="Leave Now"
                    cancelText="Stay"
                    isDanger={true}
                />
            </main>
        </div>
    );
};

export default VmeetRoom;
