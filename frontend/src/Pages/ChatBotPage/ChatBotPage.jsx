import React from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import ChatBot from '../../components/Chatbot/ChatBot';
import './ChatBotPage.css';

const ChatBotPage = () => {
  return (
    <>
    <Navbar />
    <div className="chatbot-page-wrapper">
      <div className="chatbot-page-container">
        <ChatBot />
      </div>
    </div>
    <Footer />
    </>
  );
};

export default ChatBotPage;
