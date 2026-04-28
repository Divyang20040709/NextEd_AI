import React from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import AiTutor from '../../components/AiTutor/AiTutor';
import './AiTutorPage.css';

const AiTutorPage = () => {
  return (
    <div className="aitutor-page-wrapper">
      <Navbar />
      <div className="aitutor-content-container">
        <AiTutor />
      </div>
      <Footer />
    </div>
  );
};

export default AiTutorPage;
