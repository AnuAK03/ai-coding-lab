# backend/routes/reports.py
from fastapi import APIRouter, HTTPException
from firebase_admin import firestore

router = APIRouter()


@router.get('/reports/student/{student_id}')
def get_student_reports(student_id: str):
    """
    All completed session reports for a specific student.
    """
    db = firestore.client()
    try:
        sessions = (
            db.collection('sessions')
            .where('studentId', '==', student_id)
            .where('status', '==', 'complete')
            .order_by('startedAt', direction=firestore.Query.DESCENDING)  # FIX BUG 10: sorted
            .get()
        )

        reports = []
        for doc in sessions:
            data = doc.to_dict()
            reports.append({
                'sessionId':  doc.id,
                'programId':  data.get('programId'),
                'startedAt':  str(data.get('startedAt', '')),
                'report':     data.get('report', {}),
                'violations': data.get('violations', []),
                'flagged':    data.get('flagged', False),
            })

        return {'reports': reports}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/reports/class')
def get_class_analytics():
    """
    Class-wide analytics for the teacher dashboard.
    """
    db = firestore.client()
    try:
        sessions = (
            db.collection('sessions')
            .where('status', '==', 'complete')
            .get()
        )

        total = len(sessions)
        if total == 0:
            return {'total': 0, 'tiers': {}, 'flagged': 0, 'avgQuizScore': 0, 'topWeaknesses': []}

        tiers   = {'excellent': 0, 'satisfactory': 0, 'needs_attention': 0}
        flagged = 0
        quiz_scores = []
        weakness_counts = {}

        for doc in sessions:
            data   = doc.to_dict()
            report = data.get('report', {})

            tier = report.get('performanceTier', '')
            if tier in tiers:
                tiers[tier] += 1

            if data.get('flagged'):
                flagged += 1

            qs = data.get('quizScore', 0)
            quiz_scores.append(qs)

            weakness = report.get('dominantWeakness', '')
            if weakness:
                weakness_counts[weakness] = weakness_counts.get(weakness, 0) + 1

        avg_quiz = round(sum(quiz_scores) / len(quiz_scores), 3) if quiz_scores else 0

        return {
            'total':         total,
            'tiers':         tiers,
            'flagged':       flagged,
            'avgQuizScore':  avg_quiz,
            'topWeaknesses': sorted(weakness_counts.items(), key=lambda x: -x[1])[:5],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/reports/sessions/recent')
def get_recent_sessions():
    """
    Returns last 50 sessions sorted by date for the teacher dashboard.
    Joins student name and program title so teacher sees readable info.  FIX BUG 7
    """
    db = firestore.client()
    try:
        # FIX BUG 10: sort by startedAt descending so newest sessions appear first
        sessions = (
            db.collection('sessions')
            .order_by('startedAt', direction=firestore.Query.DESCENDING)
            .limit(50)
            .get()
        )

        # Collect unique IDs so we can batch-fetch names/titles
        student_ids = set()
        program_ids = set()
        raw = []
        for doc in sessions:
            data = doc.to_dict()
            raw.append((doc.id, data))
            if data.get('studentId'):
                student_ids.add(data['studentId'])
            if data.get('programId'):
                program_ids.add(data['programId'])

        # Batch fetch users
        student_map = {}
        for sid in student_ids:
            try:
                u = db.collection('users').document(sid).get()
                if u.exists:
                    d = u.to_dict()
                    student_map[sid] = d.get('name', sid[:8])
            except Exception:
                student_map[sid] = sid[:8]

        # Batch fetch programs
        program_map = {}
        for pid in program_ids:
            try:
                p = db.collection('programs').document(pid).get()
                if p.exists:
                    program_map[pid] = p.to_dict().get('title', pid[:12])
            except Exception:
                program_map[pid] = pid[:12]

        result = []
        for session_id, data in raw:
            sid = data.get('studentId', '')
            pid = data.get('programId', '')
            result.append({
                'sessionId':       session_id,
                'studentId':       sid,
                'studentName':     student_map.get(sid, sid[:8] if sid else '—'),   # FIX BUG 7
                'programId':       pid,
                'programTitle':    program_map.get(pid, pid[:12] if pid else '—'),  # FIX BUG 7
                'status':          data.get('status'),
                'quizScore':       data.get('quizScore', 0),
                'hintsUsed':       data.get('hintsUsed', 0),
                'flagged':         data.get('flagged', False),
                'performanceTier': data.get('report', {}).get('performanceTier', ''),
                'runAttempts':     data.get('runAttempts', 0),
                'violationCount':  len(data.get('violations', [])),
                'startedAt':       str(data.get('startedAt', '')),
            })

        return {'sessions': result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/reports/program/{program_id}/attempts')
def get_program_attempts(program_id: str):
    """
    Returns how many times each student has attempted a given program.
    Used by ProgramLibrary to show attempt counts.
    """
    db = firestore.client()
    try:
        sessions = (
            db.collection('sessions')
            .where('programId', '==', program_id)
            .get()
        )
        counts: dict[str, int] = {}
        for doc in sessions:
            sid = doc.to_dict().get('studentId', '')
            if sid:
                counts[sid] = counts.get(sid, 0) + 1
        return {'attempts': counts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/student/{student_id}/timeline')
def get_student_timeline(student_id: str):
    """
    Full learning timeline for a student — used by the teacher's
    Student Detail page. Returns every session (all statuses) sorted
    newest-first with program title, quiz, errors, violations, ML tier.
    """
    db = firestore.client()
    try:
        sessions = (
            db.collection('sessions')
            .where('studentId', '==', student_id)
            .order_by('startedAt', direction=firestore.Query.DESCENDING)
            .get()
        )

        # Batch-fetch program titles
        program_ids = {doc.to_dict().get('programId') for doc in sessions if doc.to_dict().get('programId')}
        program_map = {}
        for pid in program_ids:
            try:
                p = db.collection('programs').document(pid).get()
                if p.exists:
                    program_map[pid] = p.to_dict().get('title', pid[:12])
            except Exception:
                program_map[pid] = pid[:12]

        # Fetch student profile
        user_doc   = db.collection('users').document(student_id).get()
        user_data  = user_doc.to_dict() if user_doc.exists else {}

        timeline = []
        for doc in sessions:
            d = doc.to_dict()
            pid = d.get('programId', '')
            report = d.get('report', {})
            timeline.append({
                'sessionId':       doc.id,
                'programId':       pid,
                'programTitle':    program_map.get(pid, d.get('programTitle', pid[:12] if pid else '—')),
                'attemptNumber':   d.get('attemptNumber', '?'),
                'status':          d.get('status', ''),
                'startedAt':       str(d.get('startedAt', '')),
                'timeTakenMs':     d.get('timeTakenMs', 0),
                'quizScore':       d.get('quizScore', 0),
                'runAttempts':     d.get('runAttempts', 0),
                'hintsUsed':       d.get('hintsUsed', 0),
                'errorCount':      len(d.get('errors', [])),
                'violationCount':  len(d.get('violations', [])),
                'flagged':         d.get('flagged', False),
                'performanceTier': report.get('performanceTier', ''),
                'dominantWeakness': report.get('dominantWeakness', ''),
                'teacherSummary':  report.get('teacherSummary', ''),
                'plagiarismScore': report.get('plagiarismScore', 0),
                'plagiarismFlagged': report.get('plagiarismFlagged', False),
            })

        # Aggregate stats across all completed sessions
        completed = [t for t in timeline if t['status'] == 'complete']
        avg_quiz  = round(sum(t['quizScore'] for t in completed) / len(completed), 3) if completed else 0
        tiers     = {'excellent': 0, 'satisfactory': 0, 'needs_attention': 0}
        for t in completed:
            if t['performanceTier'] in tiers:
                tiers[t['performanceTier']] += 1

        return {
            'student': {
                'uid':        student_id,
                'name':       user_data.get('name', ''),
                'email':      user_data.get('email', ''),
                'rollNumber': user_data.get('rollNumber', ''),
                'classId':    user_data.get('classId', ''),
                'department': user_data.get('department', ''),
                'year':       user_data.get('year', ''),
                'streak':     user_data.get('streak', 0),
                'badges':     user_data.get('badges', []),
                'avgScore':   user_data.get('avgScore', avg_quiz),
            },
            'timeline':  timeline,
            'summary': {
                'totalAttempts':    len(timeline),
                'completedCount':   len(completed),
                'avgQuizScore':     avg_quiz,
                'tiers':            tiers,
                'totalViolations':  sum(t['violationCount'] for t in timeline),
                'flaggedCount':     sum(1 for t in timeline if t['flagged']),
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
