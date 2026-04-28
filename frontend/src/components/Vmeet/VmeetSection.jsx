import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './VmeetSection.css';

const VmeetSection = () => {
    const navigate = useNavigate();
    const [joinCode, setJoinCode] = useState('');

    const handleInstantMeeting = () => {
        const randomRoomId = Math.random().toString(36).substring(2, 10);
        navigate(`/vmeet/${randomRoomId}`);
    };

    const handleJoinMeeting = () => {
        if (joinCode.trim()) {
            navigate(`/vmeet/${joinCode.trim()}`);
        } else {
            alert("Please enter a valid room code.");
        }
    };

    return (
        <section className="vmeet-wrapper">
            <div className="vmeet-hero-container">
                {/* Left Side: Content */}
                <div className="vmeet-left-content">
                    <h1 className="vmeet-title">Premium Video Meetings. <br /> Now Free for Everyone.</h1>
                    <p className="vmeet-description">
                        We re-engineered the service we built for secure business meetings, NextEd Vmeet, 
                        to make it free and available for all.
                    </p>
                </div>

                {/* Right Side: Cards */}
                <div className="vmeet-right-cards">
                    {/* Card 1: Create Meeting */}
                    <div className="vmeet-card create-card">
                        <div className="card-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 7l-7 5 7 5V7z"></path>
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                            </svg>
                        </div>
                        <h3>New Meeting</h3>
                        <p>Create a secure link for your meeting</p>
                        <button className="button-primary vmeet-btn" onClick={handleInstantMeeting}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Instant Meeting
                        </button>
                    </div>

                    {/* Card 2: Join Meeting */}
                    <div className="vmeet-card join-card">
                        <div className="card-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </div>
                        <h3>Join Meeting</h3>
                        <p>Enter the code or link to join</p>
                        <div className="join-input-group">
                            <input 
                                type="text" 
                                placeholder="Enter a code" 
                                className="input-style join-input" 
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                            />
                            <button className="vmeet-join-link-btn" onClick={handleJoinMeeting}>Join</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default VmeetSection;
