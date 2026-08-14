from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import firebase_admin
from firebase_admin import credentials

# Load environment variables FIRST
load_dotenv()

# Verify GROQ_API_KEY is loaded (masked for security)
groq_key = os.getenv('GROQ_API_KEY')
if groq_key:
    print(f"✓ GROQ_API_KEY loaded: {groq_key[:10]}...{groq_key[-4:]}")
else:
    print("✗ WARNING: GROQ_API_KEY not found in environment!")

# Initialize Firebase Admin SDK BEFORE importing routes
if not firebase_admin._apps:
    firebase_key_path = os.getenv('FIREBASE_KEY_PATH', 'config/firebase_key.json')
    cred = credentials.Certificate(firebase_key_path)
    firebase_admin.initialize_app(cred)

# Now import routes (they can safely use firestore.client())
from routes import session, hints, quiz, reports, explainer, chatbot

app = FastAPI(title="CodeLab API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session.router, prefix="/api")
app.include_router(hints.router, prefix="/api")
app.include_router(quiz.router, prefix='/api')
app.include_router(reports.router, prefix="/api")
app.include_router(explainer.router, prefix='/api')
app.include_router(chatbot.router, prefix='/api')

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "CodeLab API running"}