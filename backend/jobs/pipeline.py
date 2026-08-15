# backend/jobs/pipeline.py
import os
from groq import Groq
import firebase_admin
from firebase_admin import firestore
from dotenv import load_dotenv

from ml.model import predict_and_explain
from analysis.plagiarism import check_plagiarism

load_dotenv()

groq_client = Groq(api_key=os.environ.get('GROQ_API_KEY'))

BADGE_DEFINITIONS = {
    'first_program':  {'name': 'First Program',  'icon': '🏅'},
    'no_hints':       {'name': 'No Hints',        'icon': '🧠'},
    'perfect_quiz':   {'name': 'Perfect Quiz',    'icon': '⭐'},
    'five_streak':    {'name': '5-Day Streak',    'icon': '🔥'},
    'debugger':       {'name': 'Debugger',        'icon': '🐛'},
    'speed_run':      {'name': 'Speed Run',       'icon': '⚡'},
    'lab_complete':   {'name': 'Lab Complete',    'icon': '📚'},
    'clean_code':     {'name': 'Clean Code',      'icon': '🎯'},
}


def check_and_award_badges(db, student_id: str, session: dict, total_programs: int) -> list:
    """
    Checks all badge conditions for this student after a submission.
    Returns list of newly earned badge IDs.
    """
    from datetime import datetime, timezone

    user_ref = db.collection('users').document(student_id)
    user_doc = user_ref.get()
    user     = user_doc.to_dict()
    existing_badges  = set(user.get('badges', []))
    badge_timestamps = user.get('badgeTimestamps', {})
    newly_earned     = []

    all_sessions = db.collection('sessions') \
        .where('studentId', '==', student_id) \
        .where('status', '==', 'complete') \
        .get()
    completed_sessions = [s.to_dict() for s in all_sessions]

    now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)

    def award(badge_id):
        if badge_id not in existing_badges:
            newly_earned.append(badge_id)
            existing_badges.add(badge_id)
            badge_timestamps[badge_id] = now_ms   # FIX BUG 2: write timestamps

    if len(completed_sessions) >= 1:
        award('first_program')

    if session.get('hintsUsed', 0) == 0:
        award('no_hints')

    if session.get('quizScore', 0) >= 1.0:
        award('perfect_quiz')

    if user.get('streak', 0) >= 5:
        award('five_streak')

    if len(session.get('errors', [])) >= 3 and \
       session.get('report', {}).get('performanceTier') != 'needs_attention':
        award('debugger')

    time_min = session.get('timeTakenMs', 0) / 60000
    if 0 < time_min < 20:
        award('speed_run')

    unique_programs_done = len(set(s.get('programId') for s in completed_sessions))
    if unique_programs_done >= total_programs and total_programs > 0:
        award('lab_complete')

    if len(session.get('violations', [])) == 0:
        award('clean_code')

    if newly_earned:
        user_ref.update({
            'badges':          list(existing_badges),
            'badgeTimestamps': badge_timestamps,   # FIX BUG 2: persist timestamps
        })
        print(f'[Pipeline] Awarded badges to {student_id}: {newly_earned}')

    return newly_earned


def update_streak(db, student_id: str) -> int:
    """
    Updates streak based on lab submissions.
    Increments on a new day; resets to 1 if gap exceeds 2 days.
    """
    from datetime import datetime, timezone, date as date_type

    user_ref = db.collection('users').document(student_id)
    user_doc = user_ref.get()
    user     = user_doc.to_dict()

    now            = datetime.now(timezone.utc)
    last_session   = user.get('lastSessionDate')
    current_streak = user.get('streak', 0)

    if last_session is None or current_streak == 0:
        new_streak = 1
    else:
        # FIX: Firestore returns DatetimeWithNanoseconds (timezone-aware).
        # Convert safely to a plain date for arithmetic.
        try:
            if hasattr(last_session, 'date') and callable(last_session.date):
                last_date_val = last_session.date()   # works for datetime objects
            else:
                # Fallback: treat as already a date
                last_date_val = last_session

            # Ensure we're comparing date objects, not datetimes
            if isinstance(last_date_val, date_type) and not isinstance(last_date_val, datetime):
                days_gap = (now.date() - last_date_val).days
            else:
                # last_date_val is a datetime — extract date
                days_gap = (now.date() - last_date_val.date()).days

        except Exception:
            days_gap = 999  # safe fallback — resets streak

        if days_gap == 0:
            new_streak = max(1, current_streak)
        elif days_gap <= 2:
            new_streak = current_streak + 1
        else:
            new_streak = 1

    user_ref.update({
        'streak':          new_streak,
        'lastSessionDate': now,
    })

    return new_streak


def get_groq_summary(prompt: str) -> str:
    """Call Groq to convert ML analysis into plain-English teacher summary."""
    try:
        completion = groq_client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[{'role': 'user', 'content': prompt}],
            max_tokens=200,
            temperature=0.4,
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        return f'Summary unavailable: {str(e)}'


def run_pipeline(session_id: str):
    """
    Full post-submission pipeline.
    Steps:
    1. Fetch session from Firestore
    2. Run ML analysis (predict_and_explain)
    3. Run plagiarism check against same-program submissions
    4. Call Groq to generate plain-English teacher summary
    5. Write complete report back to Firestore
    6. Update streak + award badges
    """
    db = firestore.client()

    print(f'[Pipeline] Starting for session: {session_id}')

    try:
        # ── Step 1: Fetch session ──────────────────────────────
        session_ref = db.collection('sessions').document(session_id)
        session_doc = session_ref.get()

        if not session_doc.exists:
            print(f'[Pipeline] Session not found: {session_id}')
            return

        session    = session_doc.to_dict()
        program_id = session.get('programId')

        session_ref.update({'status': 'processing'})

        # ── Step 2: ML analysis ───────────────────────────────
        print(f'[Pipeline] Running ML analysis...')
        ml_result = predict_and_explain(session)

        # ── Step 3: Plagiarism check ──────────────────────────
        print(f'[Pipeline] Running plagiarism check...')
        plagiarism_result = {'plagiarismScore': 0, 'plagiarismFlagged': False, 'matches': []}

        try:
            other_sessions = db.collection('sessions') \
                .where('programId', '==', program_id) \
                .where('status', 'in', ['submitted', 'complete']) \
                .get()

            other_submissions = []
            for doc in other_sessions:
                data = doc.to_dict()
                if data.get('finalCode') and doc.id != session_id:
                    other_submissions.append({
                        'sessionId': doc.id,
                        'studentId': data.get('studentId', ''),
                        'code':      data.get('finalCode', ''),
                    })

            if other_submissions:
                plagiarism_result = check_plagiarism(
                    target_code=session.get('finalCode', ''),
                    target_id=session_id,
                    other_submissions=other_submissions,
                )
        except Exception as e:
            print(f'[Pipeline] Plagiarism check failed (non-critical): {e}')

        # ── Step 4: Groq summary ──────────────────────────────
        print(f'[Pipeline] Generating Groq teacher summary...')
        teacher_summary = get_groq_summary(ml_result['groqPrompt'])

        # ── Step 5a: Compute avgScore for student user doc ───────
        # Fetch all completed sessions to recompute rolling average
        try:
            all_done = db.collection('sessions') \
                .where('studentId', '==', session.get('studentId')) \
                .where('status', '==', 'complete') \
                .get()
            scores = [d.to_dict().get('quizScore', 0) for d in all_done]
            # Include the current session's score (not yet 'complete' status)
            current_score = float(session.get('quizScore', 0))
            scores.append(current_score)
            avg_score = round(sum(scores) / len(scores), 4) if scores else 0.0
        except Exception:
            avg_score = float(session.get('quizScore', 0))

        # ── Step 5b: Fetch program title to store on session doc ─
        # Fixes: StudentDashboard recent sessions showed raw programId
        try:
            prog_doc = db.collection('programs').document(program_id).get()
            program_title = prog_doc.to_dict().get('title', '') if prog_doc.exists else ''
        except Exception:
            program_title = ''

        # ── Step 5: Write report ──────────────────────────────
        print(f'[Pipeline] Writing report to Firestore...')
        session_ref.update({
            'status':       'complete',
            'reportId':     session_id,   # BUG 1 fix: write reportId
            'programTitle': program_title, # BUG: store title on session for dashboard
            'report': {
                'performanceTier':   ml_result['performanceTier'],
                'confidence':        ml_result['confidence'],
                'diceChanges':       ml_result['diceChanges'],
                'errorTags':         ml_result['errorTags'],
                'quizAnalysis':      ml_result['quizAnalysis'],
                'dominantWeakness':  ml_result['dominantWeakness'],
                'teacherSummary':    teacher_summary,
                'plagiarismScore':   plagiarism_result['plagiarismScore'],
                'plagiarismFlagged': plagiarism_result['plagiarismFlagged'],
                'plagiarismMatches': plagiarism_result['matches'],
            },
            'flagged': plagiarism_result['plagiarismFlagged'],
        })

        # ── Step 6: Streak + Badges ───────────────────────────
        print(f'[Pipeline] Updating streak...')
        new_streak = update_streak(db, session.get('studentId'))

        print(f'[Pipeline] Checking badges...')
        programs_snap  = db.collection('programs').where('active', '==', True).get()
        total_programs = len(programs_snap)

        updated_session = session_ref.get().to_dict()
        newly_earned    = check_and_award_badges(
            db, session.get('studentId'), updated_session, total_programs
        )

        # ── Step 7: Write avgScore to user doc ────────────────
        # Fixes: StudentDashboard "Average quiz score" always showed —
        try:
            db.collection('users').document(session.get('studentId')).update({
                'avgScore': avg_score,
            })
        except Exception as e:
            print(f'[Pipeline] avgScore update failed (non-critical): {e}')

        print(f'[Pipeline] Streak: {new_streak}, New badges: {newly_earned}')
        print(f'[Pipeline] Complete for session: {session_id}')

    except Exception as e:
        print(f'[Pipeline] FAILED for {session_id}: {e}')
        try:
            db.collection('sessions').document(session_id).update({
                'status':        'pipeline_error',
                'pipelineError': str(e),
            })
        except Exception:
            pass
