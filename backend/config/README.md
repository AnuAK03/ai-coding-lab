# Backend Configuration Guide

## Required Files

### 1. `.env` file (in backend root)
Located at: `backend/.env`

**Required environment variables:**
- `GROQ_API_KEY` - Your Groq API key for LLM functionality
- `FIREBASE_KEY_PATH` - Path to Firebase credentials (default: config/firebase_key.json)

**How to get Groq API Key:**
1. Visit: https://console.groq.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste it into the `.env` file

---

### 2. `firebase_key.json` (in this folder)
Located at: `backend/config/firebase_key.json`

**How to get Firebase Service Account Key:**

1. **Go to Firebase Console:** https://console.firebase.google.com/
2. **Select your project** (or create a new one if needed)
3. **Enable required services:**
   - Firestore Database (for storing sessions, users, programs)
   - Authentication (for user login)
4. **Get Service Account Key:**
   - Click the gear icon (⚙️) → **Project Settings**
   - Go to the **Service Accounts** tab
   - Click **"Generate new private key"**
   - Click **"Generate key"** to download the JSON file
5. **Replace the placeholder:**
   - Take the downloaded JSON file
   - Replace `backend/config/firebase_key.json` with it

---

## Security Notes

⚠️ **IMPORTANT:** Never commit these files to version control!

Make sure these are in your `.gitignore`:
```
.env
config/firebase_key.json
```

---

## Verification

Once you've added both files, you can verify the setup by running:

```bash
cd backend
python -m uvicorn main:app --reload
```

You should see:
- ✓ GROQ_API_KEY loaded: [first 10 chars]...[last 4 chars]
- No Firebase errors

If successful, the API will be available at: http://localhost:8000
API docs: http://localhost:8000/docs
