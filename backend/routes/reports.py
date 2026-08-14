# backend/routes/reports.py
from fastapi import APIRouter, HTTPException
import firebase_admin
from firebase_admin import firestore

router = APIRouter()


@router.get('/reports/student/{student_id}')
def get_student_reports(student_id: str):
    """
    Get all completed session reports for a specific student.
    Teacher uses this to view a student's history.
    """
    db = firestore.client()
    try:
        sessions = db.collection('sessions') \
            .where('studentId', '==', student_id) \
            .where('status', '==', 'complete') \
            .get()

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
    Returns aggregated stats across all completed sessions.
    """
    db = firestore.client()
    try:
        sessions = db.collection('sessions') \
            .where('status', '==', 'complete') \
            .get()

        total = len(sessions)
        if total == 0:
            return {'total': 0, 'tiers': {}, 'flagged': 0, 'avgQuizScore': 0}

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
            'topWeaknesses': sorted(weakness_counts.items(),
                                    key=lambda x: -x[1])[:5],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/reports/sessions/recent')
def get_recent_sessions():
    """
    Returns all sessions (any status) for the teacher dashboard table.
    Includes student info by joining with users collection.
    """
    db = firestore.client()
    try:
        sessions = db.collection('sessions').limit(50).get()

        result = []
        for doc in sessions:
            data = doc.to_dict()
            result.append({
                'sessionId':      doc.id,
                'studentId':      data.get('studentId'),
                'programId':      data.get('programId'),
                'status':         data.get('status'),
                'quizScore':      data.get('quizScore', 0),
                'hintsUsed':      data.get('hintsUsed', 0),
                'flagged':        data.get('flagged', False),
                'performanceTier': data.get('report', {}).get('performanceTier', ''),
                'startedAt':      str(data.get('startedAt', '')),
            })

        return {'sessions': result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))