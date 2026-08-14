# backend/routes/hints.py
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq

router = APIRouter()

# Groq client — loaded once when server starts
# Reads GROQ_API_KEY from environment (loaded in main.py via load_dotenv)
client = Groq(api_key=os.environ.get('GROQ_API_KEY'))

# ── Models ──────────────────────────────────────────────────────

class HintRequest(BaseModel):
    programId:    str
    programTitle: str              # e.g. 'Fibonacci Series'
    programDesc:  str              # full description
    concepts:     list[str]        # e.g. ['loops', 'variables']
    userCode:     str              # student's current code
    hintNumber:   int              # which hint is this (1, 2, or 3)

class HintResponse(BaseModel):
    hint:           str
    hintsRemaining: int


# ── The system prompt — most important part ──────────────────────
# This is what prevents Groq from giving away the answer.
# Be very explicit — LLMs will give answers if you don't constrain them.

HINT_SYSTEM_PROMPT = """
You are a programming tutor helping a college student understand
a coding problem. Your role is to guide — not to solve.

STRICT RULES:
1. NEVER write complete code or give the full solution.
2. NEVER write more than 3 lines of code as illustration.
3. Explain the LOGIC or APPROACH the student should think about.
4. Ask a guiding question to make the student think.
5. If the student already has correct logic, point out what to fix next.
6. Keep your response under 120 words.
7. Be encouraging and friendly.

Focus on the concept the student is missing, not the syntax.
"""


@router.post('/hints/ask', response_model=HintResponse)
def ask_hint(req: HintRequest):
    """
    Called when student clicks 'Get Hint' in the session.
    Sends their current code + program context to Groq.
    Returns a Socratic hint — guides without solving.
    """
    HINT_LIMIT = 3

    if req.hintNumber > HINT_LIMIT:
        raise HTTPException(
            status_code=400,
            detail='Hint limit reached. No more hints for this session.'
        )

    # Build the user message with all context Groq needs
    user_message = f"""
Program: {req.programTitle}
Task: {req.programDesc}
Concepts involved: {', '.join(req.concepts)}
This is hint #{req.hintNumber} of {HINT_LIMIT}.

Student's current code:
```python
{req.userCode[:1500]}
```

Give a hint that helps the student understand the next step.
Do NOT write the solution. Guide their thinking.
"""

    try:
        completion = client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[
                {'role': 'system', 'content': HINT_SYSTEM_PROMPT},
                {'role': 'user',   'content': user_message},
            ],
            max_tokens=200,
            temperature=0.4,   # lower = more focused, less creative
        )

        hint_text = completion.choices[0].message.content.strip()

        return HintResponse(
            hint=hint_text,
            hintsRemaining=HINT_LIMIT - req.hintNumber
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f'Groq API error: {str(e)}'
        )