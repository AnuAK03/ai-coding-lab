// frontend/src/services/api.js
// Base URL is /api — Vite proxies this to http://localhost:8000
const BASE = '/api'

export async function submitSession(sessionData) {
  const res = await fetch(`${BASE}/session/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionData)
  })
  if (!res.ok) throw new Error('Failed to submit session')
  return res.json()
}

export async function runCode(code, language) {
  const res = await fetch(`${BASE}/session/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language })
  })
  if (!res.ok) throw new Error('Code execution failed')
  return res.json()
}

export async function getHint(programId, programTitle, programDesc, concepts, userCode, hintNumber) {
  const res = await fetch('/api/hints/ask', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      programId,
      programTitle,
      programDesc,
      concepts,
      userCode,
      hintNumber
    })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Failed to get hint')
  }
  return res.json()   // { hint: string, hintsRemaining: number }
}

export async function generateQuiz(programTitle, programDesc, concepts, studentCode) {
  const res = await fetch('/api/quiz/generate', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      programTitle,
      programDesc,
      concepts,
      studentCode
    })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Quiz generation failed')
  }
  return res.json()   // { questions: [...] }
}

// Day 8: Run code against test cases
export async function runTests(code, testCases) {
  const res = await fetch('/api/session/run-tests', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language: 'python', testCases })
  })
  if (!res.ok) throw new Error('Test run failed')
  return res.json()   // { results: [...], passedCount, totalCount }
}

// Day 9: Generate animated logic explainer
export async function generateExplainer(programTitle, programDesc, concepts) {
  const res = await fetch('/api/explainer/generate', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ programTitle, programDesc, concepts })
  })
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const err = await res.json()
      detail = err.detail || detail
    } catch (_) {}
    throw new Error(detail)
  }
  return res.json()   // { steps: [...] }
}

// Day 9: Ask chatbot about program logic
export async function askChatbot(programTitle, programDesc, concepts, history, question) {
  const res = await fetch('/api/chatbot/ask', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ programTitle, programDesc, concepts, history, question })
  })
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const err = await res.json()
      detail = err.detail || detail
    } catch (_) {}
    throw new Error(detail)
  }
  return res.json()   // { answer: string }
}

// Generate flowchart: Get flowchart nodes for visual flow simulator
export async function generateFlowchart(programTitle, programDesc, concepts, starterCode) {
  const res = await fetch('/api/explainer/flowchart', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ programTitle, programDesc, concepts, starterCode })
  })
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const err = await res.json()
      detail = err.detail || detail
    } catch (_) {}
    throw new Error(detail)
  }
  return res.json()   // { nodes: [...], variables: [...] }
}
