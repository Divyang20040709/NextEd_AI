import React, { useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import ContactUs from '../../components/ContactUs/ContactUs';
import AboutProjectBanner from '../../components/AboutProjectBanner/AboutProjectBanner';
import ProfileCard from '../../components/TeamProfile/TeamProfile';
import Reviews from '../../components/ReviewSection/Reviews';

const AboutPage = () => {
  // Handle scroll to contact section when hash is present
  useEffect(() => {
    if (window.location.hash === '#contact') {
      const contactElement = document.getElementById('contact');
      if (contactElement) {
        contactElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <>
    <Navbar />
    <AboutProjectBanner />
    <ProfileCard />
    <Reviews />
    <ContactUs />
    <Footer/>
    </>
  );
};

export default AboutPage;
