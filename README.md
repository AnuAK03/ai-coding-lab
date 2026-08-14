# AI Coding Lab Platform

An intelligent, AI-powered platform for teaching programming to college students, featuring proctored coding sessions, adaptive hints, ML-based plagiarism detection, and interactive algorithm visualization.

## Overview

The AI Coding Lab Platform provides a comprehensive learning environment where students practice coding in a monitored, supportive setting while teachers gain real-time insights into student progress and learning patterns. The platform combines traditional coding practice with modern AI assistance, creating an engaging educational experience.

## Features

### For Students

- **Proctored Coding Sessions**
  - Monaco code editor with syntax highlighting
  - Real-time code execution and testing
  - Webcam monitoring with violation detection (tab switches, face detection)
  - Session timer and auto-submission
  
- **Adaptive Hint System**
  - AI-generated contextual hints (3 levels per session)
  - Analyzes student code to provide relevant guidance
  - Groq LLM integration for natural language hints

- **"Understand the Logic" Interactive Learning**
  - Algorithm visualization with step-by-step breakdowns
  - Logic flow simulator with animated flowcharts
  - Real-world analogies to explain concepts
  - Socratic chatbot for Q&A about program logic
  - Drag-and-drop block arrangement puzzles

- **Post-Session Quiz**
  - Auto-generated questions based on code and concepts
  - Tests conceptual understanding, not just syntax
  - Multiple-choice format with instant feedback

- **Gamification**
  - Badge system (First Steps, Week Warrior, Code Streak Champion, etc.)
  - Streak tracking with visual heatmap
  - Progress dashboard with recent sessions

### For Teachers

- **Program Management**
  - Upload new coding problems with descriptions, concepts, starter code
  - Test case specification for automatic grading
  - Difficulty and hint limit configuration

- **Class Analytics**
  - Filter by class, section, and date range
  - Average scores, completion rates, violation statistics
  - Student performance trends over time

- **Individual Student Reports**
  - Detailed session timeline with code snapshots
  - Violation logs (timestamp, type, duration)
  - ML-based code analysis:
    - Plagiarism detection using DICE (Diversity in Code Explanation)
    - Feature extraction (cyclomatic complexity, unique operators, etc.)
    - Originality scoring and flagging

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.13)
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth
- **LLM Integration**: Groq API (llama-3.3-70b-versatile)
- **ML Pipeline**: 
  - scikit-learn (RandomForest classifier)
  - DICE counterfactuals for explainability
  - Background task processing for analysis

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v7
- **Code Editor**: Monaco Editor (VS Code editor)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Speech**: Web Speech API (browser native TTS)

## Project Structure

```
coding-lab-platform/
├── backend/
│   ├── routes/           # API endpoints
│   │   ├── session.py    # Code execution, submission, testing
│   │   ├── hints.py      # AI hint generation
│   │   ├── quiz.py       # Quiz generation
│   │   ├── reports.py    # Teacher analytics and reports
│   │   ├── explainer.py  # Algorithm visualization data
│   │   └── chatbot.py    # Socratic Q&A chatbot
│   ├── jobs/
│   │   └── pipeline.py   # ML analysis background tasks
│   ├── ml/
│   │   ├── model.py      # ML model wrapper
│   │   └── ml_bundle.pkl # Trained RandomForest + scaler + encoder
│   ├── analysis/
│   │   └── plagiarism.py # DICE-based plagiarism detection
│   ├── config/
│   │   └── firebase_key.json  # Firebase service account key
│   ├── main.py           # FastAPI app entry point
│   └── seed.py           # Database seeding script
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── student/      # Student-facing pages
│   │   │   └── teacher/      # Teacher-facing pages
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React contexts (Theme)
│   │   ├── layouts/          # Layout wrappers with nav
│   │   └── services/
│   │       ├── firebase.js   # Firebase config
│   │       └── api.js        # Backend API client
│   ├── public/               # Static assets
│   └── index.html            # SPA entry point
│
└── README.md
```

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
   ```
   GROQ_API_KEY=your_groq_api_key_here
   FIREBASE_KEY_PATH=config/firebase_key.json
   ```

5. **Add Firebase service account key**
   
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Save as `backend/config/firebase_key.json`

6. **Seed the database** (optional, for test data)
   ```bash
   python seed.py
   ```

7. **Run the backend server**
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

3. **Configure Firebase** (if not already in repo)
   
   Update `frontend/src/services/firebase.js` with your Firebase config:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     // ... other config
   };
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   
   Open browser to `http://localhost:5173`

### Test Accounts (if using seed data)

- **Teacher**: `teacher@lab.com` / `teacher123`
- **Student**: `student1@lab.com` / `student123`

## API Overview

### Core Endpoints

**Session Management**
- `POST /api/session/run` - Execute code snippet
- `POST /api/session/run-tests` - Run code against test cases
- `POST /api/session/submit` - Submit completed session (triggers ML analysis)

**Hints**
- `POST /api/hints/ask` - Get contextual hint for current code

**Quiz**
- `POST /api/quiz/generate` - Generate post-session quiz questions

**Reports & Analytics**
- `GET /api/reports/sessions?classId={id}&startDate={date}&endDate={date}` - Get filtered sessions
- `GET /api/reports/session/{id}` - Get detailed session report with ML analysis
- `GET /api/reports/class-analytics?classId={id}` - Get aggregate class metrics

**Algorithm Visualization**
- `POST /api/explainer/generate` - Generate step-by-step algorithm breakdown
- `POST /api/explainer/flowchart` - Generate flowchart nodes for visualization

**Chatbot**
- `POST /api/chatbot/ask` - Ask question about program logic (Socratic mode)

## Architecture Decisions

### Why Web Speech API instead of server-side TTS?
- **Zero latency**: Browser-native synthesis is instant
- **No bandwidth**: No audio file streaming
- **Cross-platform**: Works on all major browsers
- **Free**: No API costs or rate limits

### Why DICE for plagiarism detection?
- **Explainability**: Generates counterfactual examples showing *what would need to change* to make code original
- **Beyond similarity**: Looks at semantic patterns, not just text matching
- **Educational value**: Teachers can show students specific areas of concern

### Why Firebase Firestore?
- **Realtime updates**: Teachers see new submissions instantly
- **Flexible schema**: Easy to add new fields without migrations
- **Built-in auth**: Seamless integration with Firebase Authentication
- **Scalable**: Handles concurrent student sessions without config

### ML Pipeline Flow
1. Student submits session → FastAPI receives POST
2. Session saved to Firestore immediately
3. Background task queued (non-blocking)
4. ML model extracts features (complexity, operators, structure)
5. DICE generates counterfactuals for flagged sessions
6. Results written back to Firestore `sessions/{id}/mlReport`
7. Teacher can view in report page

## Known Limitations

- **Browser compatibility**: Web Speech API may have limited voice options on some browsers
- **Groq rate limits**: Free tier has daily token limits; upgrade for production use
- **Webcam proctoring**: Basic face detection only; not exam-grade security
- **ML model**: Trained on limited dataset; may need retraining for your use case
- **Single language**: Currently supports Python only (easy to extend)

## Future Enhancements

- Support for multiple programming languages (JavaScript, Java, C++)
- Collaborative coding sessions (pair programming mode)
- Custom test case authoring UI for teachers
- Export reports to PDF
- Integration with LMS platforms (Canvas, Moodle)

## Contributing

This is an educational prototype.
