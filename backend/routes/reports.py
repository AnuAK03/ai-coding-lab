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


@router.get('/reports/program/{program_id}/submissions')
def get_program_submissions_report(program_id: str):
    """
    Comprehensive program submission report for teacher dashboard.
    Returns:
    1. Submitted count vs Not submitted count
    2. DICE model evaluation per submitted student (performance tier,
       quiz score, hint count, violation time/type breakdown, DICE feedback, Groq summary)
    3. Not-submitted students list with their status
    """
    db = firestore.client()
    try:
        # 1. Fetch Program Metadata
        prog_doc = db.collection('programs').document(program_id).get()
        if not prog_doc.exists:
            raise HTTPException(status_code=404, detail='Program not found')
        
        prog_data = prog_doc.to_dict()
        class_id = prog_data.get('classId')

        # 2. Fetch Students in Target Class (or all students if classId not specified)
        students = []
        if class_id:
            student_docs = db.collection('users').where('role', '==', 'student').where('classId', '==', class_id).get()
            students = [{'id': doc.id, **doc.to_dict()} for doc in student_docs]
        
        # Fallback if no students found by classId
        if not students:
            all_student_docs = db.collection('users').where('role', '==', 'student').get()
            students = [{'id': doc.id, **doc.to_dict()} for doc in all_student_docs]

        # 3. Fetch All Sessions for this Program
        sessions = db.collection('sessions').where('programId', '==', program_id).get()
        
        # Map sessions by studentId
        student_sessions = {}
        for s in sessions:
            s_data = s.to_dict()
            sid = s_data.get('studentId')
            if sid:
                if sid not in student_sessions:
                    student_sessions[sid] = []
                student_sessions[sid].append({'id': s.id, **s_data})

        # Try to import predict_and_explain for on-the-fly DICE computation if needed
        predict_fn = None
        try:
            from ml.model import predict_and_explain
            predict_fn = predict_and_explain
        except Exception as e:
            print(f"[Warning] ML model import failed in reports route: {e}")

        submitted_students = []
        not_submitted_students = []

        performance_distribution = {'excellent': 0, 'satisfactory': 0, 'needs_attention': 0}
        total_violations_count = 0
        violation_breakdown = {}
        quiz_scores = []

        # Process each student
        for st in students:
            sid = st['id']
            st_name = st.get('name', 'Unknown Student')
            st_roll = st.get('rollNumber', st.get('roll_number', '—'))
            st_email = st.get('email', '')

            s_list = student_sessions.get(sid, [])
            # Find submitted/completed session first
            submitted_sess = next((s for s in s_list if s.get('status') in ['complete', 'submitted']), None)

            if submitted_sess:
                report = submitted_sess.get('report', {})
                
                # If report missing, generate DICE evaluation dynamically
                if not report and predict_fn:
                    try:
                        report = predict_fn(submitted_sess)
                        db.collection('sessions').document(submitted_sess['id']).update({'report': report})
                    except Exception as err:
                        print(f"Dynamic DICE eval failed: {err}")
                        report = {}

                tier = report.get('performanceTier') or 'satisfactory'
                if tier in performance_distribution:
                    performance_distribution[tier] += 1
                else:
                    performance_distribution['satisfactory'] += 1

                qs = submitted_sess.get('quizScore', 0)
                if isinstance(qs, (int, float)):
                    quiz_scores.append(qs)

                violations = submitted_sess.get('violations', [])
                total_violations_count += len(violations)

                for v in violations:
                    vtype = v.get('type', 'unknown') if isinstance(v, dict) else str(v)
                    violation_breakdown[vtype] = violation_breakdown.get(vtype, 0) + 1

                submitted_students.append({
                    'studentId': sid,
                    'studentName': st_name,
                    'rollNumber': st_roll,
                    'email': st_email,
                    'sessionId': submitted_sess['id'],
                    'status': submitted_sess.get('status', 'complete'),
                    'startedAt': str(submitted_sess.get('startedAt', '')),
                    'submittedAt': str(submitted_sess.get('updatedAt', submitted_sess.get('startedAt', ''))),
                    'performanceTier': tier,
                    'quizScore': round(qs * 100) if qs <= 1.0 else round(qs),
                    'hintsUsed': submitted_sess.get('hintsUsed', 0),
                    'runAttempts': submitted_sess.get('runAttempts', 0),
                    'timeTakenMs': submitted_sess.get('timeTakenMs', 0),
                    'violationCount': len(violations),
                    'violations': violations,
                    'diceChanges': report.get('diceChanges', []),
                    'teacherSummary': report.get('teacherSummary', ''),
                    'dominantWeakness': report.get('dominantWeakness', ''),
                    'quizAnalysis': report.get('quizAnalysis', {}),
                    'errorTags': report.get('errorTags', {}),
                    'flagged': submitted_sess.get('flagged', False),
                    'submitted': True
                })
            else:
                # Student has not submitted
                in_prog = next((s for s in s_list if s.get('status') == 'in_progress'), None)
                status_str = 'in_progress' if in_prog else 'not_started'
                
                not_submitted_students.append({
                    'studentId': sid,
                    'studentName': st_name,
                    'rollNumber': st_roll,
                    'email': st_email,
                    'status': status_str,
                    'lastActive': str(in_prog.get('startedAt', '')) if in_prog else '—',
                    'submitted': False
                })

        submitted_count = len(submitted_students)
        not_submitted_count = len(not_submitted_students)
        total_students = len(students)
        sub_rate = round((submitted_count / total_students * 100), 1) if total_students > 0 else 0.0
        avg_quiz = round(sum(quiz_scores) / len(quiz_scores) * 100, 1) if quiz_scores else (
            round(sum(quiz_scores) / len(quiz_scores), 1) if quiz_scores else 0
        )

        return {
            'program': {
                'id': program_id,
                'title': prog_data.get('title', 'Program'),
                'classId': class_id or 'General',
                'subject': prog_data.get('subject', 'General'),
                'difficulty': prog_data.get('difficulty', 'easy'),
                'description': prog_data.get('description', '')
            },
            'summary': {
                'totalStudents': total_students,
                'submittedCount': submitted_count,
                'notSubmittedCount': not_submitted_count,
                'submissionRate': sub_rate,
                'averageQuizScore': avg_quiz,
                'performanceDistribution': performance_distribution,
                'totalViolations': total_violations_count,
                'violationBreakdown': violation_breakdown
            },
            'submittedStudents': submitted_students,
            'notSubmittedStudents': not_submitted_students
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/reports/program/{program_id}/generate')
def generate_program_reports(program_id: str):
    """
    Triggers DICE model evaluation on-demand for all submitted sessions of a program.
    """
    db = firestore.client()
    try:
        sessions = db.collection('sessions').where('programId', '==', program_id).get()
        submitted = [s for s in sessions if s.to_dict().get('status') in ['submitted', 'complete']]

        try:
            from jobs.pipeline import run_pipeline
            processed_count = 0
            for doc in submitted:
                run_pipeline(doc.id)
                processed_count += 1
            return {'status': 'ok', 'message': f'DICE evaluation pipeline executed for {processed_count} session(s).'}
        except Exception as err:
            # Fallback to model predict_and_explain
            from ml.model import predict_and_explain
            processed_count = 0
            for doc in submitted:
                s_data = doc.to_dict()
                rep = predict_and_explain(s_data)
                db.collection('sessions').document(doc.id).update({'report': rep, 'status': 'complete'})
                processed_count += 1
            return {'status': 'ok', 'message': f'DICE model evaluated for {processed_count} session(s).'}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

