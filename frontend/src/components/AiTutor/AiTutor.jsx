import React, { useEffect, useRef, useState } from 'react';
import './AiTutor.css';

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

const AiTutor = () => {
  const particlesRef = useRef(null);
  // States: 'idle' | 'active' | 'paused' | 'processing' | 'speaking'
  const [sessionStatus, setSessionStatus] = useState('idle');
  const [showHistory, setShowHistory] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [conversation, setConversation] = useState([
    { role: 'ai', text: "Hello! I am NextEd AI. Tap the microphone to start our conversation." }
  ]);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [language, setLanguage] = useState('English');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  
  const feedRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimer = useRef(null);
  const isAiSpeakingRef = useRef(false);
  const activeRef = useRef(false);
  const isProcessingRef = useRef(false);
  const sessionStatusRef = useRef(sessionStatus);
  const handleUserMessageRef = useRef(null);
  const heartbeatRef = useRef(null);
  const languageRef = useRef(language);
  const langDropdownRef = useRef(null);
  const voicesCacheRef = useRef([]);
  const isSwitchingRef = useRef(false);

  // Voice Pre-loading
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesCacheRef.current = voices;
      }
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
     languageRef.current = language;
  }, [language]);

  // Handle outside click for language dropdown
  useEffect(() => {
     const handleClickOutside = (event) => {
         if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
             setIsLangMenuOpen(false);
         }
     };
     
     document.addEventListener('mousedown', handleClickOutside);
     return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- FUNCTIONS (useCallback to avoid initialization & dependency issues) ---

  const fetchHistory = React.useCallback(async () => {
    try {
      const userId = getUserId();
      const url = userId
        ? `http://localhost:5000/api/aitutor/history?userId=${userId}`
        : 'http://localhost:5000/api/aitutor/history';
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setChatHistory(data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  }, []);

  const saveToHistory = React.useCallback(() => {
    fetchHistory();
  }, [fetchHistory]);

  const startMic = React.useCallback(() => {
    if (recognitionRef.current && activeRef.current) {
        let currentLang = 'en-US'; // Use en-US for better compatibility
        if (languageRef.current === 'Hindi') currentLang = 'hi-IN';
        else if (languageRef.current === 'Gujarati') currentLang = 'gu-IN';
        
        // Only update lang and start if not already listening to the same lang
        if (recognitionRef.current.lang !== currentLang) {
            recognitionRef.current.lang = currentLang;
            try { recognitionRef.current.stop(); } catch(e) {} // Stop to allow lang change
        }

        try {
            recognitionRef.current.start();
            console.log(`[STT] Mic Start | Lang: ${currentLang}`);
        } catch {
            // Already started or busy, which is fine
        }
    }
  }, []);

  const stopMic = React.useCallback(() => {
    if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore if already stopped */ }
    }
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    setTranscription("");
  }, []);

  const handleEndSession = React.useCallback(() => {
    // 1. Kill Speech
    window.speechSynthesis.cancel();
    isAiSpeakingRef.current = false;
    if (streamTextRef.current) clearInterval(streamTextRef.current);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    
    // 2. Kill Mic
    stopMic();

    // 3. Set State
    setSessionStatus('idle');
    setConversation([{ role: 'ai', text: "Session ended. Tap the microphone to start a new one." }]);
    setCurrentChatId(null);
    setTranscription("");
    isProcessingRef.current = false;
    isAiSpeakingRef.current = false;
    fetchHistory();
  }, [fetchHistory, stopMic]);

  const streamTextRef = useRef(null);

  const gujaratiToDevanagari = (text) => {
      return text.split('').map(char => {
          const code = char.charCodeAt(0);
          // Gujarati range: 0x0A80 - 0x0AFF, Devanagari is 0x180 (384) offset back.
          if (code >= 0x0A81 && code <= 0x0AF1) {
              return String.fromCharCode(code - 0x0180);
          }
          return char;
      }).join('');
  };

  const speakResponse = React.useCallback((text) => {
    let cleanText = text.replace(/[*#_~]/g, '').trim();
    if (!cleanText) {
        setSessionStatus('active');
        return;
    }

    // TRANSINTERATION FIX: Prepare text for the voice engine
    let ttsText = cleanText;
    if (languageRef.current === 'Gujarati') {
        ttsText = gujaratiToDevanagari(cleanText);
        console.log("[TTS] Transliterated Gujarati to Devanagari for better pronunciation.");
    }

    // 1. Force Clear and Reset
    if (streamTextRef.current) clearInterval(streamTextRef.current);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    window.speechSynthesis.cancel(); 

    // 2. Setup Utterance
    const utterance = new SpeechSynthesisUtterance(ttsText);
    
    // Explicit Language Mapping for TTS
    let ttsLang = 'en-IN';
    if (languageRef.current === 'Hindi') ttsLang = 'hi-IN';
    else if (languageRef.current === 'Gujarati') ttsLang = 'gu-IN';
    utterance.lang = ttsLang;

    // Try to find a matching voice for the language
    const getBestVoice = () => {
        let voices = voicesCacheRef.current;
        if (voices.length === 0) {
            voices = window.speechSynthesis.getVoices();
            voicesCacheRef.current = voices;
        }
        if (voices.length === 0) return null;

        const targetBase = ttsLang.split('-')[0].toLowerCase();
        
        // Filter voices that match the language code (e.g., 'hi' or 'gu')
        const matchingVoices = voices.filter(v => {
            const vLang = v.lang.toLowerCase().replace('_', '-');
            return vLang.startsWith(targetBase);
        });

        // 1. Prioritize Google voices (high quality in Chrome)
        let best = matchingVoices.find(v => v.name.includes('Google') || v.name.includes('Natural'));
        
        // 2. Microsoft voices
        if (!best) best = matchingVoices.find(v => v.name.includes('Microsoft'));

        // 3. Fallback
        if (!best) best = matchingVoices[0];

        // 4. REGIONAL FALLBACK: If NO Gujarati voice found, use Hindi voice
        if (!best && ttsLang === 'gu-IN') {
             best = voices.find(v => v.lang.startsWith('hi') && (v.name.includes('Google') || v.name.includes('Natural'))) || 
                    voices.find(v => v.lang.startsWith('hi'));
        }
        
        return best;
    };

    const bestVoice = getBestVoice();
    if (bestVoice) {
        utterance.voice = bestVoice;
        // CRITICAL: Sync utterance.lang with the actual voice language.
        // If we are using a Hindi voice to speak Gujarati text, setting lang to 'hi-IN'
        // makes the voice use its native phonetic rules which are closer to Gujarati.
        utterance.lang = bestVoice.lang; 
    }

    utterance.rate = 1.0; 
    utterance.pitch = 1.1; 
    
    // 3. State Management
    setSessionStatus('speaking');
    isAiSpeakingRef.current = true;

    // 4. IMMEDIATE BUBBLE: Show the AI bubble right away
    setConversation(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'ai' && last.text === "") return prev; // Avoid double empty bubbles
        return [...prev, { role: 'ai', text: "" }];
    });

    // 5. RESILIENT SYNC: Fallback if onstart doesn't fire
    let syncStarted = false;
    const startWordStream = () => {
        if (syncStarted) return;
        syncStarted = true;
        
        const words = cleanText.split(' ');
        let currentWordIndex = 0;

        streamTextRef.current = setInterval(() => {
            if (!isAiSpeakingRef.current || !activeRef.current) {
                clearInterval(streamTextRef.current);
                return;
            }
            
            if (currentWordIndex < words.length) {
                const visibleText = words.slice(0, currentWordIndex + 1).join(' ');
                setConversation(prev => {
                    const newConv = [...prev];
                    const lastMsg = newConv[newConv.length - 1];
                    if (lastMsg && lastMsg.role === 'ai') lastMsg.text = visibleText;
                    return newConv;
                });
                currentWordIndex++;
            } else {
                clearInterval(streamTextRef.current);
            }
        }, 120);
    };

    utterance.onstart = startWordStream;
    // TIGHT SYNC: Trigger typing almost instantly to match audio start
    const fallbackSync = setTimeout(startWordStream, 50);

    utterance.onend = () => {
        clearTimeout(fallbackSync);
        isAiSpeakingRef.current = false;
        if (streamTextRef.current) clearInterval(streamTextRef.current);
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        
        if (activeRef.current) {
            setSessionStatus('active');
            isProcessingRef.current = false;
            // Re-sync with mic logic
            setTimeout(() => {
                if (activeRef.current) startMic();
            }, 50);
        }
        
        // Finalize text for safety
        setConversation(prev => {
            const newConv = [...prev];
            const lastMsg = newConv[newConv.length - 1];
            if (lastMsg && lastMsg.role === 'ai') lastMsg.text = cleanText;
            return newConv;
        });
        saveToHistory();
    };

    utterance.onerror = () => {
        clearTimeout(fallbackSync);
        isAiSpeakingRef.current = false;
        if (streamTextRef.current) clearInterval(streamTextRef.current);
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        if (activeRef.current) setSessionStatus('active');
        isProcessingRef.current = false;
    };

    // 6. Chromium Heartbeat Fix
    heartbeatRef.current = setInterval(() => {
        if (!isAiSpeakingRef.current) {
            clearInterval(heartbeatRef.current);
            return;
        }
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
    }, 10000);

    // 7. Speak!
    window.speechSynthesis.speak(utterance);
  }, [saveToHistory, startMic]);


  const handleUserMessage = React.useCallback(async (text) => {
      if (!text.trim() || isProcessingRef.current || isAiSpeakingRef.current) return;
      
      isProcessingRef.current = true;
      let chatId = currentChatId;
      if (!chatId) {
          try {
              const userId = getUserId();
              const res = await fetch('http://localhost:5000/api/aitutor/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
              });
              const newChat = await res.json();
              chatId = newChat._id;
              setCurrentChatId(chatId);
          } catch (err) {
              console.error("Failed to auto-create chat:", err);
              isProcessingRef.current = false;
              return;
          }
      }

      setTranscription(""); 
      setConversation(prev => [...prev, { role: 'user', text: text }]);
      setSessionStatus('processing'); 

      // 1. ADD PROCESSING TIMEOUT
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
          controller.abort();
          console.warn("AI Tutor API Timeout");
          setSessionStatus('active');
          speakResponse("I'm sorry, my brain is feeling a bit slow. Could you repeat that?");
      }, 15000); 

      try {
          const res = await fetch('http://localhost:5000/api/aitutor/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({ chatId, message: text, language: languageRef.current, userId: getUserId() })
          });
          const data = await res.json();
          clearTimeout(timeoutId);
          
          if (data.error) throw new Error(data.error);

          speakResponse(data.text);
          fetchHistory();
      } catch (err) {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
              isProcessingRef.current = false;
              return;
          }
          console.error("AI Tutor Chat Error:", err);
          const errorMsg = "I'm sorry, I'm having trouble connecting to my brain right now.";
          speakResponse(errorMsg);
          setSessionStatus('active');
          isProcessingRef.current = false;
      }
  }, [currentChatId, speakResponse, fetchHistory]);

  const startNewChat = React.useCallback(async () => {
    try {
        const userId = getUserId();
        const res = await fetch('http://localhost:5000/api/aitutor/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
        const newChat = await res.json();
        setCurrentChatId(newChat._id);
        setConversation([{ role: 'ai', text: "Hello! I am NextEd AI. Tap the microphone to start our conversation." }]);
        setTranscription("");
        isProcessingRef.current = false;
        isAiSpeakingRef.current = false;
        setSessionStatus('idle');
        setShowHistory(false);
        fetchHistory();
    } catch (err) {
        console.error("Failed to start new chat:", err);
    }
  }, [fetchHistory]);

  const loadChat = React.useCallback((chat) => {
    setConversation(chat.messages);
    setCurrentChatId(chat._id);
    setShowHistory(false);
    setSessionStatus('idle');
  }, []);

  const deleteHistory = React.useCallback(async (e, chatId) => {
    e.stopPropagation();
    try {
        await fetch(`http://localhost:5000/api/aitutor/history/${chatId}`, { method: 'DELETE' });
        fetchHistory();
        if (currentChatId === chatId) {
            handleEndSession();
        }
    } catch (err) {
        console.error("Failed to delete chat:", err);
    }
  }, [currentChatId, fetchHistory, handleEndSession]);

  const toggleSession = React.useCallback(() => {
    if (sessionStatus === 'idle' || sessionStatus === 'paused') {
        setSessionStatus('active');
        const synth = window.speechSynthesis;
        const warmup = new SpeechSynthesisUtterance(""); 
        warmup.volume = 0; 
        synth.speak(warmup);
    } else {
        setSessionStatus('paused');
    }
  }, [sessionStatus]);

  // --- EFFECTS ---

  useEffect(() => {
    sessionStatusRef.current = sessionStatus;
  }, [sessionStatus]);

  useEffect(() => {
    handleUserMessageRef.current = handleUserMessage;
  }, [handleUserMessage]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Particles Backdrop & Voice Warming
  useEffect(() => {
    // Warm up voices (Chrome often returns empty array on first call)
    window.speechSynthesis.getVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }

    const container = particlesRef.current;
    if (container) {
        container.innerHTML = '';
        const DOT_COUNT = 200; 
        for (let i = 0; i < DOT_COUNT; i++) {
            const dot = document.createElement('div');
            dot.className = 'particle';
            dot.style.left = `${Math.random() * 100}%`;
            dot.style.top  = `${Math.random() * 100}%`;
            const size = 2 + Math.random() * 3;
            dot.style.width = dot.style.height = `${size}px`;
            const duration = 0.7 + Math.random() * 1.8;
            dot.style.setProperty('--duration', `${duration}s`);
            dot.style.setProperty('--delay', `${Math.random() * 4}s`);
            container.appendChild(dot);
        }
    }
    return () => {
        if(silenceTimer.current) clearTimeout(silenceTimer.current);
        if(recognitionRef.current) recognitionRef.current.abort();
        window.speechSynthesis.cancel();
    };
  }, []);

  // Speech Recognition Setup
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
        console.error("Speech Recognition not supported in this browser.");
        return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true; 
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

        recognition.onresult = (event) => {
            if (silenceTimer.current) clearTimeout(silenceTimer.current);

            let finalTranscript = "";
            let interimTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
                else interimTranscript += event.results[i][0].transcript;
            }

            // BARGE-IN logic
            const currentVoiceText = (finalTranscript || interimTranscript).trim();
            if (isAiSpeakingRef.current && currentVoiceText.length > 2) { 
                console.log("[STT] Barge-in detected, stopping speaker.");
                window.speechSynthesis.cancel();
                isAiSpeakingRef.current = false;
                isProcessingRef.current = false;
                if (streamTextRef.current) clearInterval(streamTextRef.current);
                if (heartbeatRef.current) clearInterval(heartbeatRef.current);
                setSessionStatus('active');
                
                // Recognition will auto-restart via onend
                try { recognition.stop(); } catch { /* ignore stop error */ }
                return;
            }

            if (!isAiSpeakingRef.current && !isProcessingRef.current) {
                const txt = (finalTranscript || interimTranscript).trim();
                setTranscription(txt);
                
                if (txt.length > 0) {
                    silenceTimer.current = setTimeout(() => {
                        if (handleUserMessageRef.current) handleUserMessageRef.current(txt);
                    }, 2000); 
                }
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            if (event.error === 'not-allowed') {
                alert("Microphone access denied. Please allow microphone permissions.");
                setSessionStatus('paused');
            }
        };

        recognition.onend = () => {
            console.log("[STT] Recognition ended.");
            if (isSwitchingRef.current) {
                console.log("[STT] Language switch in progress, restarting with new config.");
                isSwitchingRef.current = false;
                startMic();
                return;
            }

            if (activeRef.current) {
                setTimeout(() => {
                    if (activeRef.current && !isSwitchingRef.current) {
                         startMic();
                    }
                }, 150);
            }
        };
    recognitionRef.current = recognition;
    return () => {
        isSwitchingRef.current = false;
        recognition.onend = null;
        try { recognition.abort(); } catch { /* cleanup skip */ }
    };
  }, [startMic]);

  useEffect(() => {
      const wasActive = activeRef.current;
      activeRef.current = (sessionStatus === 'active' || sessionStatus === 'processing' || sessionStatus === 'speaking');
      
      if (activeRef.current && !wasActive) {
          startMic();
      } else if (!activeRef.current && wasActive) {
          stopMic();
      }
  }, [sessionStatus, startMic, stopMic]);

  useEffect(() => {
    const scrollToBottom = () => {
      if (feedRef.current) {
        feedRef.current.scrollTo({
          top: feedRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    };
    
    // Request animation frame ensures DOM has finished updating
    requestAnimationFrame(scrollToBottom);
    // Fallback for slower rendering
    const timer = setTimeout(scrollToBottom, 50);
    
    return () => clearTimeout(timer);
  }, [conversation, transcription, sessionStatus]);

  const groupHistoryByDate = () => {
    const groups = { Today: [], Yesterday: [], Previous: [] };
    const now = new Date();
    chatHistory.forEach(chat => {
      const d = new Date(chat.updatedAt || chat.date);
      const diff = (now - d) / (1000 * 60 * 60 * 24);
      if (diff < 1) groups.Today.push(chat);
      else if (diff < 2) groups.Yesterday.push(chat);
      else groups.Previous.push(chat);
    });
    return groups;
  };

  const historyGroups = groupHistoryByDate();

  return (
    <div className="ai-tutor-container">
      <div className="noise"></div>
      
      {/* LEFT: Chat Interface */}
      <div className="chat-interface" style={{ position: 'relative' }}>
        <div className={`chat-box ${showHistory ? 'history-active' : ''}`}>
          <div className="chat-header">
             <div className="header-info">
                <h3>Voice AI Assistant</h3>
                <div className="status-badge">
                   <span className="dot"></span>
                   {sessionStatus.toUpperCase()}
                </div>
             </div>
          </div>
          
          <div className="conversation-feed" ref={feedRef}>
            {conversation.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <span className="message-label">{msg.role === 'user' ? 'Student' : 'NextEd AI'}</span>
                <p className="message-text">{msg.text}</p>
              </div>
            ))}
            {sessionStatus === 'processing' && (
                <div className="message ai">
                   <span className="message-label">NextEd AI</span>
                   <div className="typing-dots"><span></span><span></span><span></span></div>
                </div>
            )}
            {/* Live Transcription Bubble */}
            {(sessionStatus === 'active' || transcription) && (
              <div className="message user live-transcription">
                <span className="message-label">Student (Live)</span>
                <p className="message-text">{transcription || "..."}</p>
              </div>
            )}
          </div>

          <div className="live-status">
            <button className="history-toggle-btn" onClick={() => setShowHistory(true)}>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
               <span className="btn-label">History</span>
            </button>

            <div 
                className={`mic-icon ${sessionStatus === 'active' || sessionStatus === 'processing' || sessionStatus === 'speaking' ? 'active' : ''} ${sessionStatus === 'paused' ? 'paused' : ''}`} 
                onClick={toggleSession}
            >
                {sessionStatus === 'idle' ? (
                   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                     <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                     <line x1="12" y1="19" x2="12" y2="23"></line>
                     <line x1="8" y1="23" x2="16" y2="23"></line>
                   </svg>
                ) : (sessionStatus === 'paused' ? (
                   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                     <polygon points="5 3 19 12 5 21 5 3"></polygon>
                   </svg>
                ) : (
                   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                     <rect x="6" y="4" width="4" height="16"></rect>
                     <rect x="14" y="4" width="4" height="16"></rect>
                   </svg>
                ))}
            </div>

            <div ref={langDropdownRef} className={`custom-lang-dropdown ${isLangMenuOpen ? 'open' : ''}`}>
               <button className="current-lang" onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}>
                   <svg className="lang-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                   <span>{language}</span>
                   <svg className="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
               </button>
               
               <div className="lang-options">
                   {[
                       { val: 'English', label: 'English', icon: '🇺🇸' },
                       { val: 'Hindi', label: 'हिंदी (Hindi)', icon: '🇮🇳' },
                       { val: 'Gujarati', label: 'ગુજરાતી (Gujarati)', icon: '🇮🇳' }
                   ].map(opt => (
                       <button 
                           key={opt.val}
                           className={`lang-option ${language === opt.val ? 'selected' : ''}`}
                            onClick={() => {
                                if (language === opt.val) {
                                    setIsLangMenuOpen(false);
                                    return;
                                }
                                console.log(`[STT] Switching language to: ${opt.val}`);
                                isSwitchingRef.current = true;
                                languageRef.current = opt.val; // SYNC UPDATE
                                setLanguage(opt.val);
                                setIsLangMenuOpen(false);
                                
                                if (recognitionRef.current) {
                                    try { recognitionRef.current.abort(); } catch(e) {}
                                } else if (activeRef.current) {
                                    startMic();
                                }
                            }}
                       >
                           <span className="lang-opt-icon">{opt.icon}</span>
                           <span className="lang-opt-label">{opt.label}</span>
                           {language === opt.val && <svg className="check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                       </button>
                   ))}
               </div>
            </div>
            
             {sessionStatus !== 'idle' && (
                <button onClick={handleEndSession} className="end-session-text-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                  <span className="btn-label">End Session</span>
                </button>
             )}
          </div>
        </div>

        {/* History Sidebar Components */}
        <div className={`history-overlay ${showHistory ? 'active' : ''}`} onClick={() => setShowHistory(false)}></div>
        <div className={`history-sidebar ${showHistory ? 'open' : ''}`}>
          <div className="sidebar-header">
             <div className="header-top">
                <h4>Chat History</h4>
                <button onClick={() => setShowHistory(false)} className="close-sidebar">×</button>
             </div>
             <button className="new-chat-btn" onClick={startNewChat}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                New Chat
             </button>
          </div>
          <div className="sidebar-content">
            {Object.entries(historyGroups).map(([label, chats]) => chats.length > 0 && (
              <div key={label} className="history-group">
                <div className="group-label">{label}</div>
                {chats.map(chat => (
                  <div key={chat._id} className={`history-item ${currentChatId === chat._id ? 'active' : ''}`} onClick={() => loadChat(chat)}>
                    <div className="chat-info">
                      <span className="chat-title">{chat.title}</span>
                      <span className="chat-date">{new Date(chat.updatedAt || chat.date).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit', hour12: true})}</span>
                    </div>
                    <button className="delete-history-btn" onClick={(e) => deleteHistory(e, chat._id)} title="Delete Session">
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                       </svg>
                    </button>
                  </div>
                ))}
              </div>
            ))}
            {chatHistory.length === 0 && <div className="empty-history">No past sessions found</div>}
          </div>
        </div>
      </div>

      {/* RIGHT: Avatar Section */}
      <div className="avatar-section">
        <div className="particles" ref={particlesRef} id="particles"></div>
        <div className="stage">
           <div className="core-orb"><div className="shine"></div></div>
           <div className="face"><div className="eye"></div><div className="eye"></div></div>
        </div>
      </div>
    </div>
  );
};

export default AiTutor;
