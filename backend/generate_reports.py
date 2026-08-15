# backend/generate_reports.py
# Generate comprehensive analytics reports for testing
# Run: python generate_reports.py

import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import json
from collections import defaultdict

print("REPORT GENERATION STARTED")
load_dotenv()

# Initialize Firebase if not already initialized
if not firebase_admin._apps:
    cred = credentials.Certificate(os.getenv('FIREBASE_KEY_PATH'))
    firebase_admin.initialize_app(cred)

db = firestore.client()

def generate_class_analytics():
    """Generate comprehensive class analytics"""
    print("\n🎯 GENERATING CLASS ANALYTICS...")
    
    # Get all completed sessions
    sessions = db.collection('sessions').where('status', '==', 'complete').get()
    
    if not sessions:
        print("No completed sessions found!")
        return
    
    total_sessions = len(sessions)
    performance_tiers = {'excellent': 0, 'satisfactory': 0, 'needs_attention': 0}
    flagged_count = 0
    quiz_scores = []
    weakness_counts = defaultdict(int)
    student_stats = defaultdict(lambda: {'sessions': 0, 'total_score': 0, 'violations': 0})
    program_stats = defaultdict(lambda: {'attempts': 0, 'avg_score': 0, 'scores': []})
    
    for doc in sessions:
        data = doc.to_dict()
        report = data.get('report', {})
        
        # Performance tier analysis
        tier = report.get('performanceTier', 'needs_attention')
        if tier in performance_tiers:
            performance_tiers[tier] += 1
        
        # Flagged sessions
        if data.get('flagged', False):
            flagged_count += 1
        
        # Quiz scores
        quiz_score = data.get('quizScore', 0)
        quiz_scores.append(quiz_score)
        
        # Weakness analysis
        weakness = report.get('dominantWeakness', '')
        if weakness and weakness != 'None':
            weakness_counts[weakness] += 1
        
        # Student performance tracking
        student_id = data.get('studentId', '')
        if student_id:
            student_stats[student_id]['sessions'] += 1
            student_stats[student_id]['total_score'] += quiz_score
            student_stats[student_id]['violations'] += len(data.get('violations', []))
        
        # Program difficulty analysis
        program_id = data.get('programId', '')
        if program_id:
            program_stats[program_id]['attempts'] += 1
            program_stats[program_id]['scores'].append(quiz_score)
    
    # Calculate averages
    avg_quiz_score = round(sum(quiz_scores) / len(quiz_scores), 2) if quiz_scores else 0
    
    # Top weaknesses
    top_weaknesses = sorted(weakness_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Student performance summary
    student_performance = []
    for student_id, stats in student_stats.items():
        avg_score = round(stats['total_score'] / stats['sessions'], 2) if stats['sessions'] > 0 else 0
        student_performance.append({
            'student_id': student_id,
            'sessions': stats['sessions'],
            'avg_score': avg_score,
            'violations': stats['violations']
        })
    
    # Program difficulty analysis
    program_difficulty = []
    for program_id, stats in program_stats.items():
        if stats['scores']:
            avg_score = round(sum(stats['scores']) / len(stats['scores']), 2)
            program_difficulty.append({
                'program_id': program_id,
                'attempts': stats['attempts'],
                'avg_score': avg_score,
                'difficulty_level': 'Easy' if avg_score >= 85 else 'Medium' if avg_score >= 70 else 'Hard'
            })
    
    analytics_report = {
        'generated_at': datetime.now().isoformat(),
        'summary': {
            'total_sessions': total_sessions,
            'performance_distribution': performance_tiers,
            'flagged_sessions': flagged_count,
            'flagged_percentage': round((flagged_count / total_sessions) * 100, 2) if total_sessions > 0 else 0,
            'average_quiz_score': avg_quiz_score
        },
        'weaknesses': {
            'top_areas_for_improvement': top_weaknesses,
            'total_unique_weaknesses': len(weakness_counts)
        },
        'student_performance': sorted(student_performance, key=lambda x: x['avg_score'], reverse=True),
        'program_analysis': sorted(program_difficulty, key=lambda x: x['avg_score'])
    }
    
    print(f"📊 CLASS ANALYTICS SUMMARY:")
    print(f"   Total Sessions: {total_sessions}")
    print(f"   Average Quiz Score: {avg_quiz_score}%")
    print(f"   Performance Distribution:")
    print(f"     🟢 Excellent: {performance_tiers['excellent']} ({round(performance_tiers['excellent']/total_sessions*100, 1)}%)")
    print(f"     🟡 Satisfactory: {performance_tiers['satisfactory']} ({round(performance_tiers['satisfactory']/total_sessions*100, 1)}%)")
    print(f"     🔴 Needs Attention: {performance_tiers['needs_attention']} ({round(performance_tiers['needs_attention']/total_sessions*100, 1)}%)")
    print(f"   🚩 Flagged Sessions: {flagged_count} ({round((flagged_count / total_sessions) * 100, 2)}%)")
    
    if top_weaknesses:
        print(f"   📈 Top Areas for Improvement:")
        for weakness, count in top_weaknesses[:3]:
            print(f"     • {weakness}: {count} students")
    
    return analytics_report

def generate_student_reports():
    """Generate individual student reports"""
    print("\n👥 GENERATING STUDENT REPORTS...")
    
    # Get all students
    users = db.collection('users').where('role', '==', 'student').get()
    
    student_reports = {}
    
    for user_doc in users:
        user_data = user_doc.to_dict()
        student_id = user_doc.id
        student_name = user_data.get('name', 'Unknown')
        
        # Get student sessions (without ordering to avoid index requirement)
        sessions = (
            db.collection('sessions')
            .where('studentId', '==', student_id)
            .get()
        )
        
        # Sort sessions manually by startedAt
        sessions = sorted(sessions, key=lambda s: s.to_dict().get('startedAt', datetime.min), reverse=True)
        
        if not sessions:
            continue
        
        # Analyze student performance
        total_sessions = len(sessions)
        completed_sessions = [s for s in sessions if s.to_dict().get('status') == 'complete']
        in_progress_sessions = [s for s in sessions if s.to_dict().get('status') == 'in_progress']
        
        if completed_sessions:
            quiz_scores = [s.to_dict().get('quizScore', 0) for s in completed_sessions]
            avg_quiz_score = round(sum(quiz_scores) / len(quiz_scores), 2)
            
            # Performance trend (recent vs older sessions)
            recent_sessions = [s for s in completed_sessions[:5]]  # Last 5 sessions
            recent_scores = [s.to_dict().get('quizScore', 0) for s in recent_sessions]
            recent_avg = round(sum(recent_scores) / len(recent_scores), 2) if recent_scores else 0
            
            # Violation analysis
            total_violations = sum(len(s.to_dict().get('violations', [])) for s in completed_sessions)
            flagged_sessions = sum(1 for s in completed_sessions if s.to_dict().get('flagged', False))
            
            # Time analysis
            session_times = [s.to_dict().get('timeTakenMs', 0) / 60000 for s in completed_sessions]  # Convert to minutes
            avg_time = round(sum(session_times) / len(session_times), 1) if session_times else 0
            
            # Weakness analysis
            weaknesses = [s.to_dict().get('report', {}).get('dominantWeakness', '') for s in completed_sessions]
            weakness_counts = defaultdict(int)
            for w in weaknesses:
                if w and w != 'None':
                    weakness_counts[w] += 1
            
            dominant_weakness = max(weakness_counts.items(), key=lambda x: x[1]) if weakness_counts else ('No specific weakness', 0)
            
            student_report = {
                'student_info': {
                    'id': student_id,
                    'name': student_name,
                    'email': user_data.get('email', ''),
                    'roll_number': user_data.get('rollNumber', ''),
                    'class_id': user_data.get('classId', ''),
                    'streak': user_data.get('streak', 0),
                    'badges': user_data.get('badges', [])
                },
                'performance_summary': {
                    'total_sessions': total_sessions,
                    'completed_sessions': len(completed_sessions),
                    'in_progress_sessions': len(in_progress_sessions),
                    'average_quiz_score': avg_quiz_score,
                    'recent_performance': recent_avg,
                    'performance_trend': 'Improving' if recent_avg > avg_quiz_score else 'Declining' if recent_avg < avg_quiz_score else 'Stable',
                    'average_completion_time': avg_time
                },
                'behavioral_analysis': {
                    'total_violations': total_violations,
                    'flagged_sessions': flagged_sessions,
                    'integrity_score': max(0, 100 - (total_violations * 10 + flagged_sessions * 25)),
                    'dominant_weakness': dominant_weakness[0],
                    'weakness_frequency': dominant_weakness[1]
                },
                'recommendations': generate_student_recommendations(avg_quiz_score, recent_avg, total_violations, dominant_weakness[0])
            }
            
            student_reports[student_id] = student_report
            
            print(f"   📋 {student_name}: {avg_quiz_score}% avg, {len(completed_sessions)} sessions, {total_violations} violations")
    
    return student_reports

def generate_student_recommendations(avg_score, recent_score, violations, weakness):
    """Generate personalized recommendations for students"""
    recommendations = []
    
    # Performance-based recommendations
    if avg_score >= 90:
        recommendations.append("🌟 Excellent performance! Consider taking on more challenging advanced problems.")
    elif avg_score >= 80:
        recommendations.append("👍 Good performance! Focus on consistency and tackling medium-difficulty problems.")
    elif avg_score >= 70:
        recommendations.append("📚 Solid foundation! Practice more complex algorithms and data structures.")
    else:
        recommendations.append("💪 Focus on fundamentals. Review basic programming concepts and practice regularly.")
    
    # Trend-based recommendations
    if recent_score > avg_score + 5:
        recommendations.append("📈 Great improvement trend! Keep up the momentum.")
    elif recent_score < avg_score - 5:
        recommendations.append("⚠️ Performance declining. Consider seeking help or additional practice.")
    
    # Violation-based recommendations
    if violations > 5:
        recommendations.append("🔍 Multiple violations detected. Review academic integrity guidelines.")
    elif violations > 0:
        recommendations.append("⚡ Minor violations noted. Stay focused during sessions.")
    
    # Weakness-based recommendations
    if weakness and weakness != 'No specific weakness':
        if 'syntax' in weakness.lower():
            recommendations.append("🔤 Practice basic syntax through coding exercises.")
        elif 'logic' in weakness.lower():
            recommendations.append("🧠 Work on problem-solving and logical thinking skills.")
        elif 'algorithm' in weakness.lower():
            recommendations.append("⚙️ Study algorithmic thinking and common patterns.")
        else:
            recommendations.append(f"🎯 Focus on improving: {weakness}")
    
    return recommendations

def save_reports_to_files(class_analytics, student_reports):
    """Save generated reports to JSON files for easy access"""
    
    # Save class analytics
    with open('class_analytics_report.json', 'w') as f:
        json.dump(class_analytics, f, indent=2)
    
    # Save student reports
    with open('student_reports.json', 'w') as f:
        json.dump(student_reports, f, indent=2)
    
    # Create summary report
    summary = {
        'generation_time': datetime.now().isoformat(),
        'class_summary': class_analytics['summary'],
        'top_performers': sorted([
            {
                'name': report['student_info']['name'],
                'avg_score': report['performance_summary']['average_quiz_score'],
                'sessions': report['performance_summary']['completed_sessions']
            }
            for report in student_reports.values()
        ], key=lambda x: x['avg_score'], reverse=True)[:5],
        'students_needing_attention': [
            {
                'name': report['student_info']['name'],
                'avg_score': report['performance_summary']['average_quiz_score'],
                'weakness': report['behavioral_analysis']['dominant_weakness'],
                'violations': report['behavioral_analysis']['total_violations']
            }
            for report in student_reports.values()
            if report['performance_summary']['average_quiz_score'] < 70 or 
               report['behavioral_analysis']['total_violations'] > 3
        ]
    }
    
    with open('summary_report.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\n💾 REPORTS SAVED:")
    print(f"   📊 class_analytics_report.json - Complete class analytics")
    print(f"   👥 student_reports.json - Individual student reports")
    print(f"   📋 summary_report.json - Executive summary")

# Generate all reports
print("🚀 Starting comprehensive report generation...")

try:
    class_analytics = generate_class_analytics()
    student_reports = generate_student_reports()
    save_reports_to_files(class_analytics, student_reports)
    
    print(f"\n✅ REPORT GENERATION COMPLETED!")
    print(f"   Generated analytics for {len(student_reports)} students")
    print(f"   Class average: {class_analytics['summary']['average_quiz_score']}%")
    print(f"   Total sessions analyzed: {class_analytics['summary']['total_sessions']}")
    
except Exception as e:
    print(f"❌ Error generating reports: {str(e)}")