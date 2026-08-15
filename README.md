# AI Coding Lab Platform

An intelligent, AI-powered platform for teaching programming to college students, featuring proctored coding sessions, adaptive hints, DICE counterfactual ML evaluation, real-time analytics, and interactive algorithm visualization.

## Overview

The AI Coding Lab Platform provides a comprehensive learning environment where students practice coding in a monitored, supportive setting while teachers gain real-time insights into student progress, performance tiers (**Excellent**, **Satisfactory**, **Poor**), and learning patterns. The platform combines hands-on coding practice with modern AI assistance and ML counterfactual analysis.

---

## Features

### For Students

- **Proctored Coding Sessions & State Persistence**
  - Monaco code editor with syntax highlighting and auto-save (2-second debounced real-time draft saving).
  - Real-time code execution and test case verification.
  - Resume active sessions automatically from where you left off without losing code.
  - Line-based progress tracking (typing 2+ lines immediately awards 5%+ progress).
  - Proctored environment tracking tab switches, window blurs, copy-paste events, and devtools access with exact timestamps.

- **Adaptive Hint System**
  - AI-generated contextual hints (3 levels per session).
  - Analyzes student code to provide relevant guidance.
  - Groq LLM integration for natural language hint explanations.

- **"Understand the Logic" Interactive Learning**
  - Algorithm visualization with step-by-step breakdowns.
  - Logic flow simulator with animated flowcharts.
  - Real-world analogies explaining core concepts.
  - Socratic chatbot for Q&A about program logic.
  - Drag-and-drop block arrangement puzzles.

- **Post-Session Quiz & DICE Reports**
  - Auto-generated concept viva quiz questions.
  - Real-time streak tracking and badge evaluations (**First Steps**, **No Hints**, **Perfect Quiz**, **Code Streak Champion**, **Clean Code**).
  - Detailed DICE Session Evaluation report displaying performance tier (**Excellent**, **Satisfactory**, **Poor**), key stats, DICE model counterfactual recommendations, code evolution diffs, and timestamped integrity violation logs.

---

### For Teachers

- **Upload Program Dashboard**
  - Create and manage programming assignments with description, starter code, concept tags, and test cases.
  - Per-program student submission breakdown displaying Submitted vs Pending counters.
  - Expandable student submission table (`STUDENT | DATE | STATUS | HINTS | DURATION | SCORE | ACTION`).
  - View Report modal giving complete DICE ML feedback, Groq AI summaries, and timestamped violation logs.

- **Deep Analytics & Performance Distribution**
  - Donut chart performance breakdown into **Excellent**, **Satisfactory**, and **Poor** tiers.
  - **Academic Year Dropdown Selector** (`2024-2025`, `2025-2026`, `2026-2027`, `2027-2028`, `2028-2029`).
  - **12-Month Academic Progress Chart** starting from **August** through **July** (`Aug`, `Sep`, `Oct`, `Nov`, `Dec`, `Jan`, `Feb`, `Mar`, `Apr`, `May`, `Jun`, `Jul`).
  - Dynamic **Class Improvement Trend** tracking monthly average class quiz scores.
  - Interactive **Tier Roster Modal** listing all students in any selected tier (**Excellent**, **Satisfactory**, **Poor**) with score percentages.

- **Student Roster & Activity Management**
  - Real-time progress monitoring via Firestore `onSnapshot` listeners.
  - Per-student detailed view showing session histories, streak counts, and activity heatmaps.

---

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.13)
- **Database**: Firebase Firestore (NoSQL, real-time sync)
- **Authentication**: Firebase Auth
- **LLM Integration**: Groq API (`llama-3.3-70b-versatile`)
- **ML Pipeline**: 
  - scikit-learn (RandomForest classifier)
  - DICE counterfactuals for explainable ML recommendations
  - Background task pipeline processing for session evaluations

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 8
- **Styling**: Vanilla CSS & Tailwind CSS
- **Routing**: React Router v7
- **Code Editor**: Monaco Editor (@monaco-editor/react)
- **Icons**: Lucide React
- **Speech**: Web Speech API (browser native TTS)

---

## Project Structure

```
ai-coding-lab/
├── backend/
│   ├── routes/           # API endpoints
│   │   ├── session.py    # Code execution, submission, testing
│   │   ├── hints.py      # AI hint generation
│   │   ├── quiz.py       # Quiz generation
│   │   ├── reports.py    # Teacher analytics and reports
│   │   ├── explainer.py  # Algorithm visualization data
│   │   └── chatbot.py    # Socratic Q&A chatbot
│   ├── jobs/
│   │   └── pipeline.py   # ML analysis & streak update background tasks
│   ├── ml/
│   │   ├── model.py      # ML model wrapper
│   │   └── ml_bundle.pkl # Trained RandomForest + scaler + encoder
│   ├── analysis/
│   │   └── plagiarism.py # DICE-based counterfactual analysis
│   ├── config/
│   │   └── firebase_key.json  # Firebase service account key
│   ├── main.py           # FastAPI app entry point
│   └── seed.py           # Database seeding script
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── student/      # Student-facing pages (Dashboard, Library, MyProgress, MyReport, Session, Quiz)
│   │   │   └── teacher/      # Teacher-facing pages (TeacherDashboard, UploadProgram, ClassAnalytics, StudentsManagement)
│   │   ├── components/       # Reusable UI components (CalendarWidget, StreakHeatmap, BadgeGrid, CodeDiffViewer)
│   │   ├── contexts/         # React contexts (ThemeContext)
│   │   ├── hooks/            # Custom hooks (useSession, useProctor)
│   │   ├── layouts/          # Layout wrappers with sidebar navigation
│   │   └── services/
│   │       ├── firebase.js   # Firebase config & initialization
│   │       └── api.js        # Backend API client
│   ├── public/               # Static assets
│   └── index.html            # SPA entry point
│
└── README.md
```

---

## Setup Instructions

### Prerequisites

- **Python 3.13+** with pip
- **Node.js 18+** with npm
- **Firebase Project** (Firestore + Auth enabled)
- **Groq API Key** ([get one here](https://console.groq.com/))

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # macOS/Linux
   ```

3. **Install dependencies**
   ```bash
   pip install fastapi uvicorn python-dotenv firebase-admin groq scikit-learn dice-ml
   ```

4. **Configure environment variables**
   
   Create `backend/.env`:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   FIREBASE_KEY_PATH=config/firebase_key.json
   ```

5. **Add Firebase service account key**
   - Save your Firebase service account JSON to `backend/config/firebase_key.json`.

6. **Run the backend server**
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   Open browser to `http://localhost:5173`

---

## Verification & Build

To test and build the production bundle:
```bash
cd frontend
npm run build
```

---

## License & Educational Usage

This project is built for educational programming lab instruction and real-time student evaluation.
