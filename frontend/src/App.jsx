import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import HomePage from "./Pages/HomePage/HomePage";
import AboutPage from "./Pages/AboutPage/AboutPage";
import ChatBotPage from "./Pages/ChatBotPage/ChatBotPage";
import TutorPage from "./Pages/TutorPage/TutorPage";
import LoginPage from "./Pages/LoginPage/LoginPage";
import SignupPage from "./Pages/SignupPage/SignupPage";
import StudentSignup from "./Pages/SignupPage/StudentSignup";
import TeacherSignup from "./Pages/SignupPage/TeacherSignup";
import StudentClassroom from "./Pages/StudentClassroom/StudentClassroom";
import TeacherClassroom from "./Pages/TeacherClassroom/TeacherClassroom";
import AdminPage from "./Pages/AdminPage/AdminPage";
import AdminLogin from "./Pages/AdminPage/AdminLogin";
import AdminSignup from "./Pages/AdminPage/AdminSignup";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import GlobalAuthHandler from "./components/GlobalAuthHandler/GlobalAuthHandler";
import VmeetPage from "./Pages/VmeetPage/VmeetPage";
import VmeetRoomPage from "./Pages/VmeetPage/VmeetRoomPage";




function App() {
  const location = useLocation();

  React.useEffect(() => {
    document.body.classList.remove('theme-green', 'theme-red');
    if (location.pathname.includes('/teacher')) {
      document.body.classList.add('theme-green');
    } else if (location.pathname.includes('/admin')) {
      document.body.classList.add('theme-red');
    }
  }, [location.pathname]);

  return (
    <>
      <ScrollToTop />
      <GlobalAuthHandler />
      <div className="fog-overlay"></div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/homepage" element={<HomePage />} />
        <Route path="/aboutpage" element={<AboutPage />} />
        <Route path="/chatbotpage" element={<ChatBotPage />} />
        <Route path="/tutorpage" element={<TutorPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup/student" element={<StudentSignup />} />
        <Route path="/signup/teacher" element={<TeacherSignup />} />
        <Route 
          path="/student" 
          element={
            <ProtectedRoute allowedRole="student">
              <StudentClassroom />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher" 
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherClassroom />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<AdminSignup />} />
        <Route path="/vmeet" element={<VmeetPage />} />
        <Route path="/vmeet/:roomId" element={<VmeetRoomPage />} />
      </Routes>

    </>
  );
}

export default App;

