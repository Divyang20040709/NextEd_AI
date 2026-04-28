import React, { useState, useEffect } from "react";
import "./TeacherDashboard.css";

const TeacherDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("classrooms");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) setIsSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const selectTab = (tab) => {
    setActiveTab(tab);
    closeSidebar();
  };

  return (
    <div className="td-root">
      {/* DASHBOARD TOGGLE BUTTON */}
      <button 
        className={`td-toggle-btn ${isSidebarOpen ? 'active' : ''}`}
        onClick={toggleSidebar}
        aria-label="Toggle Dashboard Sidebar"
      />

      {/* DASHBOARD OVERLAY */}
      {isSidebarOpen && <div className="td-overlay" onClick={closeSidebar} />}

      <div className="td-wrapper">
        {/* SIDEBAR */}
        <aside className={`td-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="td-sidebar-header">
            <h2>Teacher Dashboard</h2>
          </div>
          
          <nav className="td-sidebar-nav">
            <button
              className={`td-nav-item ${activeTab === 'classrooms' ? 'active' : ''}`}
              onClick={() => selectTab('classrooms')}
            >
              My Classrooms
            </button>
            <button
              className={`td-nav-item ${activeTab === 'exams' ? 'active' : ''}`}
              onClick={() => selectTab('exams')}
            >
              Exam Builder
            </button>
          </nav>

          <div className="td-sidebar-footer">
            <button className="td-logout-btn">Logout</button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className={`td-main-content ${isSidebarOpen ? 'shifted' : ''}`}>
          <header className="td-page-header">
            <h1>Welcome Back, Teacher! 👋</h1>
            <p>
              {activeTab === 'classrooms' 
                ? "Manage your classrooms and monitor student progress" 
                : "Create and manage AI-powered exams"
              }
            </p>
          </header>

          <div className="td-stats">
            <div className="td-stat-card">
              <div className="td-stat-label">Total Classrooms</div>
              <div className="td-stat-number">12</div>
            </div>
            <div className="td-stat-card">
              <div className="td-stat-label">Total Students</div>
              <div className="td-stat-number">248</div>
            </div>
            <div className="td-stat-card">
              <div className="td-stat-label">Active Exams</div>
              <div className="td-stat-number">8</div>
            </div>
            <div className="td-stat-card">
              <div className="td-stat-label">Completion Rate</div>
              <div className="td-stat-number">92%</div>
            </div>
          </div>

          <section className="td-recent-activity">
            <h2>Recent Activity</h2>
            <div className="td-activity-list">
              <div className="td-activity-item">
                <span className="td-activity-icon">📝</span>
                <div>
                  <div className="td-activity-title">New exam created for Class 10A</div>
                  <div className="td-activity-time">2 hours ago</div>
                </div>
              </div>
              <div className="td-activity-item">
                <span className="td-activity-icon">✅</span>
                <div>
                  <div className="td-activity-title">25 students completed Math Quiz</div>
                  <div className="td-activity-time">5 hours ago</div>
                </div>
              </div>
              <div className="td-activity-item">
                <span className="td-activity-icon">👥</span>
                <div>
                  <div className="td-activity-title">New students added to Class 9B</div>
                  <div className="td-activity-time">1 day ago</div>
                </div>
              </div>
              <div className="td-activity-item">
                <span className="td-activity-icon">📊</span>
                <div>
                  <div className="td-activity-title">Exam results published</div>
                  <div className="td-activity-time">2 days ago</div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;
