# backend/routes/explainer.py
import os, json, re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from groq import Groq

router = APIRouter()
client = Groq(api_key=os.environ.get('GROQ_API_KEY'))


class ExplainerRequest(BaseModel):
    programTitle: str
    programDesc:  str
    concepts:     list[str]

class ExplainerStep(BaseModel):
    stepNumber:  int
    title:       str       # single compact line (under 12 words), e.g. 'Take input from user'
    narration:   str       # what gets spoken aloud -- plain spoken English (optional for voice)
    visualHint:  str       # one of: 'input' | 'loop' | 'condition' | 'compute' | 'output'
    isBranch:    bool = False  # True for Else-branches that should be indented

class ExplainerResponse(BaseModel):
    steps: List[ExplainerStep]


class FlowchartRequest(BaseModel):
    programTitle: str
    programDesc:  str
    concepts:     list[str]
    starterCode:  str

class FlowchartNode(BaseModel):
    id:         str
    type:       str  # 'start' | 'process' | 'decision' | 'output' | 'end'
    label:      str
    connectsTo: list[str]

class FlowchartResponse(BaseModel):
    nodes:     List[FlowchartNode]
    variables: list[str]  # optional variable names for tracker


EXPLAINER_SYSTEM_PROMPT = """
You are a programming tutor creating a COMPACT PSEUDOCODE-STYLE algorithm walkthrough
for a college student, before they write any code.

STRICT RULES:
1. NEVER include actual code or syntax of any language.
2. Explain ALGORITHM LOGIC ONLY -- what happens conceptually, in order.
3. Produce between 4 and 7 steps. Not more, not fewer.
4. Each step's "title" must be ONE SHORT LINE (under 12 words) like pseudocode.
   Examples: "Start", "Take input from user", "Divide number by 2", "Stop"
5. The "narration" field is for optional voice narration (keep it conversational),
   but the main display uses ONLY the "title" field — make it concise!
6. For conditional/branching logic:
   - Format If-steps as: "If <condition> → <outcome>"
   - Format Else-steps as: "Else → <outcome>" with isBranch: true
   - Else-steps will be indented in the UI, so don't include "Else if" as a separate If — 
     just chain them as separate steps with isBranch.
7. visualHint must be exactly one of: input, loop, condition, compute, output
8. Return ONLY valid JSON, no markdown fences, no commentary.

EXAMPLE for "Check if number is even or odd":
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Start",
      "narration": "Begin the algorithm",
      "visualHint": "input",
      "isBranch": false
    },
    {
      "stepNumber": 2,
      "title": "Take input from the user",
      "narration": "Get a number from the user to check",
      "visualHint": "input",
      "isBranch": false
    },
    {
      "stepNumber": 3,
      "title": "Divide the number by 2",
      "narration": "Perform division to check for remainder",
      "visualHint": "compute",
      "isBranch": false
    },
    {
      "stepNumber": 4,
      "title": "If remainder is 0 → Even",
      "narration": "If there's no remainder, the number is even",
      "visualHint": "condition",
      "isBranch": false
    },
    {
      "stepNumber": 5,
      "title": "Else → Odd",
      "narration": "Otherwise the number is odd",
      "visualHint": "condition",
      "isBranch": true
    },
    {
      "stepNumber": 6,
      "title": "Stop",
      "narration": "End the algorithm",
      "visualHint": "output",
      "isBranch": false
    }
  ]
}

JSON format:
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "compact pseudocode line here",
      "narration": "optional spoken explanation",
      "visualHint": "input",
      "isBranch": false
    }
  ]
}
"""


def extract_json(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    cleaned = re.sub(r'```json|```', '', text).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start, end = cleaned.find('{'), cleaned.rfind('}') + 1
        if start != -1 and end > start:
            return json.loads(cleaned[start:end])
        raise ValueError('Could not extract JSON from explainer response')


@router.post('/explainer/generate', response_model=ExplainerResponse)
def generate_explainer(req: ExplainerRequest):
    """
    Called when the student clicks 'Understand the logic' before coding.
    Produces a structured, code-free walkthrough of the algorithm.
    """
    user_message = f"""
Program: {req.programTitle}
Task: {req.programDesc}
Concepts: {', '.join(req.concepts)}

Create a step-by-step LOGIC walkthrough (no code) for a student
who has not started coding yet.
"""
    try:
        completion = client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[
                {'role': 'system', 'content': EXPLAINER_SYSTEM_PROMPT},
                {'role': 'user',   'content': user_message},
            ],
            max_tokens=900,
            temperature=0.4,
        )
        data = extract_json(completion.choices[0].message.content)
        steps = data.get('steps', [])
        if not steps:
            raise ValueError('Empty steps list returned')
        return ExplainerResponse(steps=[ExplainerStep(**s) for s in steps])

    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Explainer generation failed: {str(e)}')


FLOWCHART_SYSTEM_PROMPT = """
You are a programming tutor creating a visual flowchart representation
of an algorithm's logic flow.

STRICT RULES:
1. Create a LINEAR TOP-TO-BOTTOM flowchart (no complex branching diagrams).
2. Each node must have a unique id (string, e.g. "1", "2", "3"...).
3. Node types: 'start', 'process', 'decision', 'output', 'end'
   - start: exactly one, at the beginning
   - process: computational steps, assignments, calculations
   - decision: if/else, while/for conditions (use sparingly)
   - output: return value or print statement
   - end: exactly one, at the end
4. Keep it simple: 5-8 nodes total, linear flow preferred.
5. connectsTo: array of node IDs this node connects to (usually just one, except decision nodes can have two).
6. variables: array of variable names that are key to this algorithm (e.g. ["n", "result", "i"]) -- can be empty.
7. Return ONLY valid JSON, no markdown fences, no commentary.

JSON format:
{
  "nodes": [
    { "id": "1", "type": "start", "label": "Start", "connectsTo": ["2"] },
    { "id": "2", "type": "process", "label": "Initialize sum = 0", "connectsTo": ["3"] },
    { "id": "3", "type": "decision", "label": "i < n?", "connectsTo": ["4", "5"] },
    { "id": "4", "type": "process", "label": "sum += i", "connectsTo": ["3"] },
    { "id": "5", "type": "output", "label": "Return sum", "connectsTo": ["6"] },
    { "id": "6", "type": "end", "label": "End", "connectsTo": [] }
  ],
  "variables": ["n", "sum", "i"]
}
"""


@router.post('/explainer/flowchart', response_model=FlowchartResponse)
def generate_flowchart(req: FlowchartRequest):
    """
    Generate an animated flowchart representation of the algorithm logic.
    """
    user_message = f"""
Program: {req.programTitle}
Task: {req.programDesc}
Concepts: {', '.join(req.concepts)}

Starter code:
{req.starterCode[:500] if req.starterCode else 'None provided'}

Create a simple top-to-bottom flowchart showing the algorithm's logic flow.
Keep it linear and easy to understand.
"""
    try:
        completion = client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[
                {'role': 'system', 'content': FLOWCHART_SYSTEM_PROMPT},
                {'role': 'user',   'content': user_message},
            ],
            max_tokens=1000,
            temperature=0.4,
        )
        data = extract_json(completion.choices[0].message.content)
        nodes = data.get('nodes', [])
        variables = data.get('variables', [])
        
        if not nodes:
            raise ValueError('Empty nodes list returned')
        
        return FlowchartResponse(
            nodes=[FlowchartNode(**n) for n in nodes],
            variables=variables
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Flowchart generation failed: {str(e)}')
