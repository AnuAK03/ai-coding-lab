# backend/routes/session.py
import subprocess
import tempfile
import os
import time
from fastapi import APIRouter, BackgroundTasks, HTTPException
from firebase_admin import firestore
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from jobs.pipeline import run_pipeline
router = APIRouter()

# ── Request / Response models ──────────────────────────────────

class RunCodeRequest(BaseModel):
    code:      str
    language:  str = 'python'   # only python for now
    sessionId: Optional[str] = None

class RunCodeResponse(BaseModel):
    stdout:    str
    stderr:    str
    exitCode:  int
    tookMs:    int             # execution time in milliseconds

class SubmitSessionRequest(BaseModel):
    sessionId:   str
    studentId:   str
    programId:   str

# ── Day 8: Test Case models ──────────────────────────────────

class TestCase(BaseModel):
    input:          str = ''
    expectedOutput: str
    label:          str = ''

class RunTestsRequest(BaseModel):
    code:      str
    language:  str = 'python'
    testCases: List[TestCase]

class TestResult(BaseModel):
    label:    str
    passed:   bool
    input:    str
    expected: str
    actual:   str
    error:    str = ''

class RunTestsResponse(BaseModel):
    results:      List[TestResult]
    passedCount:  int
    totalCount:   int


# ── Sandboxed Python runner ─────────────────────────────────────

def run_python_sandboxed(code: str, timeout: int = 10) -> dict:
    with tempfile.NamedTemporaryFile(
        mode='w',
        suffix='.py',
        delete=False,
        encoding='utf-8'
    ) as f:
        f.write(code)
        tmp_path = f.name

    start = time.time()

    try:
        result = subprocess.run(
            ['python', tmp_path],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        took_ms = int((time.time() - start) * 1000)
        return {
            'stdout':   result.stdout[:5000],
            'stderr':   result.stderr[:2000],
            'exitCode': result.returncode,
            'tookMs':   took_ms,
        }

    except subprocess.TimeoutExpired:
        took_ms = int((time.time() - start) * 1000)
        return {
            'stdout':   '',
            'stderr':   f'TimeoutError: Code ran for more than {timeout} seconds.',
            'exitCode': 1,
            'tookMs':   took_ms,
        }

    except Exception as e:
        return {
            'stdout':   '',
            'stderr':   f'Execution error: {str(e)}',
            'exitCode': 1,
            'tookMs':   0,
        }

    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


# ── Day 8: Test runner with stdin support ─────────────────────────

def run_python_with_input(code: str, stdin_input: str, timeout: int = 10) -> dict:
    """
    Same sandboxing as run_python_sandboxed, but feeds stdin_input
    to the process — needed because test cases provide program input.
    """
    with tempfile.NamedTemporaryFile(
        mode='w', suffix='.py', delete=False, encoding='utf-8'
    ) as f:
        f.write(code)
        tmp_path = f.name

    try:
        result = subprocess.run(
            ['python', tmp_path],
            input=stdin_input,        # fed to the program's stdin
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return {
            'stdout':   result.stdout,
            'stderr':   result.stderr,
            'exitCode': result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {'stdout': '', 'stderr': 'TimeoutError', 'exitCode': 1}
    except Exception as e:
        return {'stdout': '', 'stderr': str(e), 'exitCode': 1}
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


# ── Routes ─────────────────────────────────────────────────────

@router.post('/session/run', response_model=RunCodeResponse)
def run_code(req: RunCodeRequest):
    if req.language != 'python':
        return RunCodeResponse(
            stdout='', stderr='Only Python is supported.',
            exitCode=1, tookMs=0
        )
    result = run_python_sandboxed(req.code)
    return RunCodeResponse(**result)


@router.post("/session/submit")
def submit_session(
    req: SubmitSessionRequest,
    background_tasks: BackgroundTasks,
):
    """
    Called when student finishes the quiz.
    Marks session as submitted and queues the ML pipeline
    as a background task — returns immediately to the student.
    """
    try:
        print(f"[Submit] Received submission for session: {req.sessionId}")
        
        # Update status in Firestore immediately
        db = firestore.client()
        db.collection('sessions').document(req.sessionId).update({
            'status': 'submitted'
        })
        
        print(f"[Submit] Session {req.sessionId} marked as submitted in Firestore")
        
        # Run pipeline in background — student doesn't wait for this
        background_tasks.add_task(run_pipeline, req.sessionId)
        
        print(f"[Submit] Pipeline queued for session: {req.sessionId}")
        
        return {
            'status':  'submitted',
            'message': 'Session received. Report will be ready within 45 minutes.'
        }
    
    except Exception as e:
        print(f"[Submit] ERROR: {str(e)}")
        raise


# ── Day 8: Test case runner endpoint ─────────────────────────────

@router.post('/session/run-tests', response_model=RunTestsResponse)
def run_tests(req: RunTestsRequest):
    """
    Runs the student's code once per test case, comparing stdout
    against the expected output (whitespace-trimmed on both sides).
    Used to verify the student is actually solving THIS program,
    not just printing something that looks plausible.
    """
    if req.language != 'python':
        raise HTTPException(status_code=400, detail='Only Python is supported.')

    results = []
    passed_count = 0

    for tc in req.testCases:
        outcome = run_python_with_input(req.code, tc.input)

        actual_trimmed   = outcome['stdout'].strip()
        expected_trimmed = tc.expectedOutput.strip()
        passed = (actual_trimmed == expected_trimmed) and outcome['exitCode'] == 0

        if passed:
            passed_count += 1

        results.append(TestResult(
            label=tc.label or f'Test {len(results)+1}',
            passed=passed,
            input=tc.input,
            expected=tc.expectedOutput,
            actual=outcome['stdout'],
            error=outcome['stderr'],
        ))

    return RunTestsResponse(
        results=results,
        passedCount=passed_count,
        totalCount=len(req.testCases),
    )