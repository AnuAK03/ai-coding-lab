# backend/routes/quiz.py
import os
import json
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from groq import Groq

router = APIRouter()
client = Groq(api_key=os.environ.get('GROQ_API_KEY'))


# ── Models ──────────────────────────────────────────────────────

class QuizRequest(BaseModel):
    programTitle: str
    programDesc:  str
    concepts:     list[str]
    studentCode:  str    # final submitted code — questions tailored to it

class QuizOption(BaseModel):
    label:  str          # 'A', 'B', 'C', 'D'
    text:   str          # option text

class QuizQuestion(BaseModel):
    id:           str
    question:     str
    options:      List[QuizOption]
    correctAnswer: str   # 'A', 'B', 'C', or 'D'
    concept_tag:  str    # e.g. 'loops', 'recursion' — used by ML model
    explanation:  str    # shown after student answers

class QuizResponse(BaseModel):
    questions: List[QuizQuestion]


# ── System prompt for quiz generation ────────────────────────────

QUIZ_SYSTEM_PROMPT = """
You are a programming quiz generator for college students in India.
Generate exactly 5 multiple-choice questions based on the given program.

RULES:
1. Mix question types: output prediction, logic understanding,
   error spotting, concept recall, edge cases.
2. Questions should be viva-style — short, direct, practical.
3. Each question must have exactly 4 options: A, B, C, D.
4. Only ONE option is correct.
5. Assign a concept_tag from: loops, arrays, recursion, functions,
   pointers, strings, logic, syntax, data_types, scope.
6. Keep each question under 40 words.
7. Return ONLY valid JSON — no markdown, no explanation, no backticks.

JSON format (return exactly this structure):
{
  "questions": [
    {
      "id": "q1",
      "question": "question text here",
      "options": [
        {"label": "A", "text": "option A"},
        {"label": "B", "text": "option B"},
        {"label": "C", "text": "option C"},
        {"label": "D", "text": "option D"}
      ],
      "correctAnswer": "A",
      "concept_tag": "loops",
      "explanation": "brief explanation of the answer"
    }
  ]
}
"""


def extract_json(text: str) -> dict:
    """
    Extracts JSON from Groq response even if it wraps it in markdown.
    Groq sometimes adds ```json ... ``` fences despite instructions.
    """
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strip markdown fences if present
    cleaned = re.sub(r'```json|```', '', text).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Find JSON object boundaries as last resort
        start = cleaned.find('{')
        end   = cleaned.rfind('}') + 1
        if start != -1 and end > start:
            return json.loads(cleaned[start:end])
        raise ValueError('Could not extract valid JSON from Groq response')


@router.post('/quiz/generate', response_model=QuizResponse)
def generate_quiz(req: QuizRequest):
    """
    Called right after student submits code.
    Generates 5 viva-style questions tailored to the program
    and the student's actual submitted code.
    """
    user_message = f"""
Program: {req.programTitle}
Task description: {req.programDesc}
Concepts: {', '.join(req.concepts)}

Student's submitted code:
```python
{req.studentCode[:1500]}
```

Generate 5 multiple-choice questions about this program.
Focus on understanding the logic, not memorising syntax.
"""

    try:
        completion = client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[
                {'role': 'system', 'content': QUIZ_SYSTEM_PROMPT},
                {'role': 'user',   'content': user_message},
            ],
            max_tokens=1500,
            temperature=0.3,  # lower = more consistent JSON structure
        )

        raw = completion.choices[0].message.content
        data = extract_json(raw)

        # Validate structure
        questions = data.get('questions', [])
        if len(questions) == 0:
            raise ValueError('Groq returned empty questions list')

        return QuizResponse(questions=[
            QuizQuestion(**q) for q in questions
        ])

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f'Quiz generation failed: {str(e)}'
        )