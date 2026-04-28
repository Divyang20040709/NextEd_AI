# Project Directory Structure - NextEd AI

This document provides a tree-view of the project structure for documentation purposes.

```text
NextEd_AI/
├── backend/                # Node.js + Express Backend
│   ├── controllers/        # Business Logic (Admin, Auth, Teacher)
│   ├── middleware/         # JWT Auth, Multer storage
│   ├── model/              # MongoDB Schemas (User, Exam, Classroom, AI)
│   ├── routes/             # API Endpoints (AI, VMeet, Exams, etc.)
│   ├── uploads/            # Static storage for user documents
│   ├── server.js           # Main Entry Point (Express + Socket.io)
│   └── package.json        # Backend Dependencies
│
├── frontend/               # React + Vite Frontend
│   ├── public/             # Static Assets
│   ├── src/
│   │   ├── assets/         # Images, Logos
│   │   ├── components/     # Reusable UI Blocks
│   │   ├── Pages/          # Main Application Screens
│   │   │   ├── AdminPage/
│   │   │   ├── AiTutorPage/
│   │   │   ├── ChatBotPage/
│   │   │   ├── Classroom/
│   │   │   ├── VmeetPage/
│   │   │   └── ...
│   │   ├── utils/          # API services & socket config
│   │   ├── App.jsx         # Routing Logic
│   │   ├── index.css       # Global Styling (Tailwind 4)
│   │   └── main.jsx        # App Entry Point
│   └── package.json        # Frontend Dependencies
│
├── Project_Documentation.doc  # Full Comprehensive Report (Word)
├── api_documentation.html    # Detailed API Technical Docs
└── .gitignore                # Files excluded from version control
```

### Key Components
- **Framework:** React 19 (Frontend) & Express 5 (Backend)
- **Styling:** Tailwind CSS 4
- **Real-time:** Socket.io (Video signaling & Peer coordination)
- **Intelligence:** Google Gemini / Groq Llama 3
- **Data:** MongoDB Atlas
