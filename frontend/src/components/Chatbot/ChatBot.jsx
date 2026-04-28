// NextEd AI ChatBot Component

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './ChatBot.css';

const API_URL = "/api";

// Get current user's ID from localStorage
const getUserId = () => {
  try {
    const data = localStorage.getItem('user_data');
    if (data) {
      const parsed = JSON.parse(data);
      return parsed._id || parsed.id || null;
    }
  } catch { /* ignore */ }
  return null;
};

// Helper to safely handle fetch responses
const handleResponse = async (res) => {
  if (!res.ok) {
    const errorText = await res.text();
    let errorJson;
    try {
      errorJson = JSON.parse(errorText);
    } catch {
      throw new Error(`Server error (${res.status}): ${errorText.substring(0, 50)}...`);
    }
    throw new Error(errorJson.error || errorJson.message || `Server error (${res.status})`);
  }
  return res.json();
};

const ChatBot = () => {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('history'); 
  const [knowledgeSnippets, setKnowledgeSnippets] = useState([]);
  const [expandedSnippets, setExpandedSnippets] = useState({}); 
  const [knowledgeInput, setKnowledgeInput] = useState({ title: '', content: '', files: [] });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [studyTips, setStudyTips] = useState([]);
  const [showTipsPrompt, setShowTipsPrompt] = useState(false);
  const [activeStudyTip, setActiveStudyTip] = useState(null);
  
  const chatContainerRef = useRef(null);

  // Load chats and knowledge on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchChats();
    fetchKnowledge();
    fetchStudyTips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchChats = async () => {
    try {
      const userId = getUserId();
      const url = userId ? `${API_URL}/history?userId=${userId}` : `${API_URL}/history`;
      const res = await fetch(url);
      const data = await handleResponse(res);
      if (Array.isArray(data)) {
        setChats(data);
        if (data.length > 0 && !currentChatId) {
          setCurrentChatId(data[0]._id);
          setMessages(data[0].messages);
        }
      } else {
        console.error("Expected array for chats, got:", data);
        setChats([]);
      }
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    }
  };

  const fetchKnowledge = async () => {
    try {
      const res = await fetch(`${API_URL}/knowledge`);
      const data = await handleResponse(res);
      if (Array.isArray(data)) {
        setKnowledgeSnippets(data);
      } else {
        console.error("Expected array for knowledge, got:", data);
        setKnowledgeSnippets([]);
      }
    } catch (err) {
      console.error("Failed to fetch knowledge:", err);
    }
  };

  const fetchStudyTips = async () => {
    try {
      const userId = getUserId();
      const url = userId ? `${API_URL}/study-tips?userId=${userId}` : `${API_URL}/study-tips`;
      const res = await fetch(url);
      const data = await handleResponse(res);
      if (Array.isArray(data)) {
        setStudyTips(data);
      }
    } catch (err) {
      console.error("Failed to fetch study tips:", err);
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    let chatId = currentChatId;
    
    // Auto-create chat if none selected
    if (!chatId) {
      try {
        const userId = getUserId();
        const res = await fetch(`${API_URL}/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
        const newChat = await handleResponse(res);
        setChats([newChat, ...chats]);
        chatId = newChat._id;
        setCurrentChatId(chatId);
        setMessages([]);
      } catch (err) {
        console.error("Failed to auto-create chat:", err);
        return;
      }
    }

    const userMsg = {
      sender: 'user',
      text: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API_URL}/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chatId, message: userMsg.text, userId: getUserId() })
      });
      const data = await handleResponse(res);
      if (data.error) throw new Error(data.error);

      setMessages(data.history.messages);
      setIsTyping(false);
      
      // Refresh chat list to update titles if changed
      fetchChats();
    } catch (err) {
      console.error("Chat error:", err);
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: "Sorry, I encountered an error: " + err.message,
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  const handleChatSelect = (chatId) => {
    const selectedChat = chats.find(c => c._id === chatId);
    if (selectedChat) {
      setCurrentChatId(chatId);
      setMessages(selectedChat.messages);
      setIsSidebarOpen(false);
      setShowTipsPrompt(false);
      setActiveStudyTip(null);
    }
  };

  const handleNewChat = async () => {
    try {
      const userId = getUserId();
      const res = await fetch(`${API_URL}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const newChat = await handleResponse(res);
      setChats([newChat, ...chats]);
      setCurrentChatId(newChat._id);
      setMessages([]);
      setIsSidebarOpen(false);
    } catch (err) {
      console.error("Failed to create chat:", err);
    }
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    try {
      await fetch(`${API_URL}/history/${chatId}`, { method: 'DELETE' });
      const updatedChats = chats.filter(c => c._id !== chatId);
      setChats(updatedChats);
      if (currentChatId === chatId) {
        if (updatedChats.length > 0) {
          handleChatSelect(updatedChats[0]._id);
        } else {
          setMessages([]);
          setCurrentChatId(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  const handleAddKnowledge = async (e) => {
    e.preventDefault();
    if (!knowledgeInput.title.trim()) return;

    const formData = new FormData();
    formData.append('title', knowledgeInput.title);
    formData.append('details', knowledgeInput.content);
    if (knowledgeInput.files) {
      for (let i = 0; i < knowledgeInput.files.length; i++) {
        formData.append('files', knowledgeInput.files[i]);
      }
    }

    try {
      const res = await fetch(`${API_URL}/knowledge`, {
        method: 'POST',
        body: formData
      });
      const newItem = await handleResponse(res);
      setKnowledgeSnippets([newItem, ...knowledgeSnippets]);
      setKnowledgeInput({ title: '', content: '', files: [] });
    } catch (err) {
      console.error("Failed to add knowledge:", err);
    }
  };

  const handleDeleteKnowledge = async (id) => {
    try {
      await fetch(`${API_URL}/knowledge/${id}`, { method: 'DELETE' });
      setKnowledgeSnippets(knowledgeSnippets.filter(s => s._id !== id));
    } catch (err) {
      console.error("Failed to delete knowledge:", err);
    }
  };

  const toggleExpanded = (id) => setExpandedSnippets(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleStudyTipsRequest = () => {
    setShowTipsPrompt(true);
    setActiveStudyTip(null);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleGenerateStudyTips = async () => {
    setIsTyping(true);
    setShowTipsPrompt(false);
    try {
      const userId = getUserId();
      const res = await fetch(`${API_URL}/study-tips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await handleResponse(res);
      if (data.error) throw new Error(data.error);

      setActiveStudyTip(data);
      setStudyTips([data, ...studyTips]);
      setIsTyping(false);
    } catch (err) {
      console.error("Failed to generate tips:", err);
      setIsTyping(false);
      alert("Failed to generate tips: " + err.message);
    }
  };

  const handleSelectPastTip = (tip) => {
    setActiveStudyTip(tip);
    setShowTipsPrompt(false);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDeleteTip = async (e, tipId) => {
    e.stopPropagation();
    try {
      await fetch(`${API_URL}/study-tips/${tipId}`, { method: 'DELETE' });
      setStudyTips(prev => prev.filter(t => t._id !== tipId));
      if (activeStudyTip?._id === tipId) {
        setActiveStudyTip(null);
      }
    } catch (err) {
      console.error("Failed to delete study tip:", err);
    }
  };

  return (
    <div className="chatbot-container">
      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={toggleSidebar}></div>
      
      {/* LEFT SIDEBAR */}
      <div className={`chat-history-panel ${isSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="chat-history-header">
           <button className="create-chat-btn" onClick={handleNewChat}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Conversation
           </button>
        </div>

        <div className="sidebar-tabs">
          <button className={`tab-btn ${sidebarTab === 'history' ? 'active' : ''}`} onClick={() => setSidebarTab('history')}>History</button>
          <button className={`tab-btn ${sidebarTab === 'knowledge' ? 'active' : ''}`} onClick={() => setSidebarTab('knowledge')}>Knowledge</button>
          <button className={`tab-btn ${sidebarTab === 'tips' ? 'active' : ''}`} onClick={() => setSidebarTab('tips')}>Tips</button>
        </div>
        
        <div className="sidebar-content">
          {sidebarTab === 'history' ? (
            <div className="chat-history-list">
              {chats.map(chat => (
                <div key={chat._id} className={`chat-history-item ${currentChatId === chat._id ? 'active' : ''}`} onClick={() => handleChatSelect(chat._id)}>
                  <div className="chat-item-main">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span>{chat.title}</span>
                  </div>
                  <button className="delete-chat-btn" onClick={(e) => handleDeleteChat(e, chat._id)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                </div>
              ))}
            </div>
          ) : sidebarTab === 'knowledge' ? (
            <div className="knowledge-panel">
              <div className="knowledge-form-container">
                <div className="knowledge-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#38BDF8'}}><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"/></svg>
                  <h4>Knowledge Base</h4>
                </div>
                <p className="knowledge-desc">Upload materials for AI to use as context.</p>
                <form onSubmit={handleAddKnowledge} className="knowledge-form">
                  <div className="form-group"><label>PROJECT TITLE</label><input type="text" placeholder="e.g., Physics..." value={knowledgeInput.title} onChange={(e) => setKnowledgeInput({...knowledgeInput, title: e.target.value})} required /></div>
                  <div className="form-group"><label>DETAILS / NOTES</label><textarea placeholder="Type context..." value={knowledgeInput.content} onChange={(e) => setKnowledgeInput({...knowledgeInput, content: e.target.value})} /></div>
                  <div className="form-group">
                    <label>UPLOAD (PDF/PPT/DOC)</label>
                    <label className="file-upload-label">
                      <input type="file" multiple onChange={(e) => setKnowledgeInput({...knowledgeInput, files: e.target.files})} />
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <span style={{ marginLeft: '10px' }}>{knowledgeInput.files && knowledgeInput.files.length > 0 ? `${knowledgeInput.files.length} files selected` : 'Select Files'}</span>
                    </label>
                  </div>
                  <button type="submit" className="submit-knowledge-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> SUBMIT</button>
                </form>
              </div>
              <div className="knowledge-list">
                {knowledgeSnippets.map(snippet => (
                  <div key={snippet._id} className="knowledge-card">
                    <div className="knowledge-card-header">
                      <div className="snippet-title">
                        <svg className="pin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {snippet.title}
                      </div>
                      <button className="delete-snippet-btn" onClick={() => handleDeleteKnowledge(snippet._id)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                    </div>
                    <div className="knowledge-card-content">
                      <p>{expandedSnippets[snippet._id] ? snippet.details : `${(snippet.details || "").substring(0, 90)}${(snippet.details || "").length > 90 ? '...' : ''}`}</p>
                      {snippet.files && snippet.files.length > 0 && (
                        <div className="file-attachments">
                          {snippet.files.map(f => (
                            <div key={f.filename} className="file-badge">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                              {f.filename}
                            </div>
                          ))}
                        </div>
                      )}
                      {(snippet.details || "").length > 90 && (<button className={`read-toggle-btn ${expandedSnippets[snippet._id] ? 'read-less' : 'read-more'}`} onClick={() => toggleExpanded(snippet._id)}>{expandedSnippets[snippet._id] ? 'Read Less ←' : 'Read More →'}</button>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="study-tips-history">
              <div className="tips-history-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#FACC15'}}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                <h4>Study Tips History</h4>
              </div>
              <div className="tips-list">
                {studyTips.map(tip => (
                  <div key={tip._id} className={`tip-history-item ${activeStudyTip?._id === tip._id ? 'active' : ''}`} onClick={() => handleSelectPastTip(tip)}>
                    <div className="tip-item-info">
                       <span className="tip-summary">{tip.title}</span>
                    </div>
                    <button className="delete-tip-btn" onClick={(e) => handleDeleteTip(e, tip._id)} title="Delete Tip">
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                       </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-footer">
           <button className="study-tips-btn" onClick={handleStudyTipsRequest}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
              Study Tips
           </button>
        </div>
      </div>

      {/* RIGHT MAIN PANEL */}
      <div className="chat-main-panel">
        <div className="chat-header">
          <div className="chat-header-info">
            <h2 className="chat-title desktop-header-title">NextEd AI Assistant</h2>
            <div className="mobile-chat-title">ChatBot</div>
            <div className="online-indicator-wrapper" onClick={toggleSidebar}>
              <span className="online-dot"></span><span className="online-text">Online</span>
              <div className="mobile-hamburger"><span></span><span></span><span></span></div>
            </div>
          </div>
        </div>

        <div className="chat-messages-area" ref={chatContainerRef}>
          {messages.length === 0 && !isTyping && (
            <div className="welcome-message">
              <h3>Welcome to NextEd AI!</h3>
              <p>Start a new conversation or select one from history.</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`message-wrapper ${msg.sender}`}>
              <div className="message-avatar">
                {msg.sender === 'bot' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                )}
              </div>
              <div className="message-bubble">
                {msg.sender === 'bot' ? (
                  <div className="markdown-content">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({...props}) => (
                          <div className="markdown-content-table-wrapper">
                            <table {...props} />
                          </div>
                        )
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.text}</p>
                )}
                <span className="message-timestamp">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (<div className="message-wrapper bot"><div className="message-bubble typing-bubble"><div className="typing-indicator"><span></span><span></span><span></span></div></div></div>)}
          
          {showTipsPrompt && (
            <div className="study-tips-prompt-container">
              <div className="prompt-card">
                <div className="prompt-header">
                  <div className="prompt-icon">💡</div>
                  <h4>Improve Your Study Journey</h4>
                </div>
                <p>Hello there! 👋 Do you want to improve your study and need some specialized tips to achieve your goals? I can carefully analyze our previous conversations to provide you with personalized guidance. Would you like to proceed?</p>
                <div className="prompt-actions">
                  <button className="prompt-btn yes" onClick={handleGenerateStudyTips}>Yes, please!</button>
                  <button className="prompt-btn no" onClick={() => setShowTipsPrompt(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {activeStudyTip && (
            <div className="study-tips-display-container">
              <div className="tips-card">
                <div className="tips-card-header">
                   <div className="tips-title">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                      Study Tips for You
                   </div>
                   <button className="close-tips-btn" onClick={() => setActiveStudyTip(null)}>&times;</button>
                </div>
                <div className="tips-content markdown-content">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({...props}) => (
                        <div className="markdown-content-table-wrapper">
                          <table {...props} />
                        </div>
                      )
                    }}
                  >
                    {activeStudyTip.tips.replace(/<br\s*\/?>/gi, '\n')}
                  </ReactMarkdown>
                </div>
                <div className="tips-footer">
                  <p>Need study tips again? Or you can close this window.</p>
                  <div className="tips-footer-actions">
                     <button className="tips-again-btn" onClick={handleGenerateStudyTips}>Generate Again</button>
                     <button className="tips-close-btn" onClick={() => setActiveStudyTip(null)}>Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-container">
          <div className="input-wrapper">
            <input type="text" className="chat-input" placeholder="Ask anything about your learning…" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleKeyPress} disabled={isTyping} />
            <button className="send-btn" onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
