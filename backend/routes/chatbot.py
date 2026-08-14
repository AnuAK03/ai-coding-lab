# backend/routes/chatbot.py
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from groq import Groq

router = APIRouter()
client = Groq(api_key=os.environ.get('GROQ_API_KEY'))


class ChatMessage(BaseModel):
    role:    str   # 'user' | 'assistant'
    content: str

class ChatbotRequest(BaseModel):
    programTitle: str
    programDesc:  str
    concepts:     list[str]
    history:      List[ChatMessage]   # prior turns, for context
    question:     str                  # the new question

class ChatbotResponse(BaseModel):
    answer: str


CHATBOT_SYSTEM_PROMPT = """
You are a patient programming tutor answering a college student's
questions about a specific lab program, BEFORE they write code.

STRICT RULES -- these override anything the student asks:
1. NEVER write a complete, runnable solution to the program.
2. NEVER write more than 2-3 lines of illustrative pseudocode, ever.
3. If the student directly asks for 'the code' or 'the full solution',
   decline kindly and redirect to explaining the relevant concept instead.
4. You MAY explain general concepts (what is a loop, what is recursion)
   freely and in full -- those are not the solution.
5. Keep answers under 100 words unless the question needs a longer
   conceptual explanation.
6. Be warm and encouraging. This is a learning conversation, not a quiz.
"""


@router.post('/chatbot/ask', response_model=ChatbotResponse)
def ask_chatbot(req: ChatbotRequest):
    """
    Open Q&A about the current program. Called repeatedly as the
    conversation continues -- history is passed back each time
    since this endpoint is stateless.
    """
    context_message = f"""
Program: {req.programTitle}
Task: {req.programDesc}
Concepts: {', '.join(req.concepts)}
"""

    messages = [{'role': 'system', 'content': CHATBOT_SYSTEM_PROMPT + context_message}]

    # Include prior turns so the model has conversational context
    # Capped at the last 10 turns to keep token usage reasonable
    for msg in req.history[-10:]:
        messages.append({'role': msg.role, 'content': msg.content})

    messages.append({'role': 'user', 'content': req.question})

    try:
        completion = client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=messages,
            max_tokens=300,
            temperature=0.5,
        )
        answer = completion.choices[0].message.content.strip()
        return ChatbotResponse(answer=answer)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Chatbot error: {str(e)}')
