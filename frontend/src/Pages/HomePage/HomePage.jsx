import React from 'react';
import Navbar from '../../components/Navbar/Navbar';
import HeroBanner from '../../components/HeroBanner/HeroBanner';
import TableBanner from '../../components/TableBanner/TableBanner';
import FeaturesBanner from '../../components/FeaturesBanner/FeaturesBanner';
import RoleIntroBanner from '../../components/RoleIntroBanner/RoleIntroBanner';
import Footer from '../../components/Footer/Footer';
import SloganBanner from '../../components/SloganBanner/SloganBanner';
import TeacherDashboard from '../../components/TeacherDashboard/TeacherDashboard';

const HomePage = () => {
 

  return (
    <>
    <Navbar />
    <HeroBanner />
    <TableBanner />
    <FeaturesBanner />
    <RoleIntroBanner />
    <SloganBanner />
    <Footer />
    </>
  );
};

export default HomePage;
