# backend/seed_enhanced.py
# Enhanced seed script with comprehensive test data
# Run: python seed_enhanced.py

import firebase_admin
from firebase_admin import credentials, auth, firestore
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import random
import json

print("ENHANCED SEED SCRIPT STARTED")
load_dotenv()

# Initialize Firebase if not already initialized
if not firebase_admin._apps:
    cred = credentials.Certificate(os.getenv('FIREBASE_KEY_PATH'))
    firebase_admin.initialize_app(cred)

db = firestore.client()

# ── Enhanced User Creation ──────────────────────────────────────
def create_user(email, password, name, role, extra={}):
    try:
        user = auth.create_user(email=email, password=password)
        db.collection('users').document(user.uid).set({
            'uid': user.uid,
            'email': email,
            'name': name,
            'role': role,
            'streak': extra.get('streak', 0),
            'badges': extra.get('badges', []),
            'avgScore': extra.get('avgScore', 0),
            'createdAt': firestore.SERVER_TIMESTAMP,
            **extra
        })
        print(f'Created {role}: {email} (UID: {user.uid})')
        return user.uid
    except Exception as e:
        print(f'User may already exist: {email} — {e}')
        # Try to get existing user
        try:
            existing_user = auth.get_user_by_email(email)
            return existing_user.uid
        except:
            return None

# Create teachers
teacher_uid = create_user('teacher@lab.com', 'teacher123', 'Prof. Sharma', 
                         'teacher', {'department': 'Computer Science'})

# Create more diverse students with realistic data
students_data = [
    {
        'email': 'arjun.patel@lab.com', 'password': 'student123', 'name': 'Arjun Patel',
        'rollNumber': 'CS001', 'department': 'Computer Science', 'year': 2, 'section': 'A',
        'classId': 'CS-2-A', 'streak': 7, 'avgScore': 85.5,
        'badges': ['First Program', 'Quiz Master', 'Consistent Learner']
    },
    {
        'email': 'priya.nair@lab.com', 'password': 'student123', 'name': 'Priya Nair',
        'rollNumber': 'CS002', 'department': 'Computer Science', 'year': 2, 'section': 'A',
        'classId': 'CS-2-A', 'streak': 12, 'avgScore': 92.3,
        'badges': ['First Program', 'Quiz Master', 'Perfect Score', 'Speed Coder']
    },
    {
        'email': 'rohan.mehta@lab.com', 'password': 'student123', 'name': 'Rohan Mehta',
        'rollNumber': 'CS003', 'department': 'Computer Science', 'year': 2, 'section': 'A',
        'classId': 'CS-2-A', 'streak': 3, 'avgScore': 73.8,
        'badges': ['First Program', 'Consistent Learner']
    },
    {
        'email': 'ananya.singh@lab.com', 'password': 'student123', 'name': 'Ananya Singh',
        'rollNumber': 'CS004', 'department': 'Computer Science', 'year': 2, 'section': 'A',
        'classId': 'CS-2-A', 'streak': 15, 'avgScore': 88.7,
        'badges': ['First Program', 'Quiz Master', 'Algorithm Expert', 'Speed Coder']
    },
    {
        'email': 'kiran.kumar@lab.com', 'password': 'student123', 'name': 'Kiran Kumar',
        'rollNumber': 'CS005', 'department': 'Computer Science', 'year': 2, 'section': 'B',
        'classId': 'CS-2-B', 'streak': 5, 'avgScore': 79.2,
        'badges': ['First Program', 'Debugging Master']
    },
    {
        'email': 'maya.reddy@lab.com', 'password': 'student123', 'name': 'Maya Reddy',
        'rollNumber': 'CS006', 'department': 'Computer Science', 'year': 2, 'section': 'B',
        'classId': 'CS-2-B', 'streak': 9, 'avgScore': 86.1,
        'badges': ['First Program', 'Quiz Master', 'Logic Master']
    }
]

student_uids = {}
for student in students_data:
    uid = create_user(
        student['email'], student['password'], student['name'], 'student',
        {k: v for k, v in student.items() if k not in ['email', 'password', 'name']}
    )
    if uid:
        student_uids[student['name']] = uid

# ── Enhanced Programs ──────────────────────────────────────────
programs_data = [
    {
        'title': 'Fibonacci Series',
        'description': 'Print the Fibonacci series up to N terms.',
        'language': 'python',
        'difficulty': 'easy',
        'concepts': ['loops', 'variables'],
        'hintLimit': 3,
        'active': True,
        'subject': 'Programming Fundamentals',
        'classId': 'CS-2-A',
        'starterCode': 'n = int(input())\n# your code here',
        'testCases': [
            {'label': 'n=5', 'input': '5', 'expectedOutput': '0 1 1 2 3'},
            {'label': 'n=1', 'input': '1', 'expectedOutput': '0'},
            {'label': 'n=7', 'input': '7', 'expectedOutput': '0 1 1 2 3 5 8'},
        ],
    },
    {
        'title': 'Linear Search',
        'description': 'Implement linear search on a list of integers.',
        'language': 'python',
        'difficulty': 'easy',
        'concepts': ['loops', 'arrays'],
        'hintLimit': 3,
        'active': True,
        'subject': 'Programming Fundamentals',
        'classId': 'CS-2-A',
        'starterCode': 'arr = list(map(int, input().split()))\ntarget = int(input())\n# your code here',
        'testCases': [
            {'label': 'found', 'input': '3 1 4 1 5\n4', 'expectedOutput': '2'},
            {'label': 'missing', 'input': '1 2 3\n9', 'expectedOutput': '-1'},
        ],
    },
    {
        'title': 'Factorial using Recursion',
        'description': 'Compute factorial of N using a recursive function.',
        'language': 'python',
        'difficulty': 'medium',
        'concepts': ['recursion', 'functions'],
        'hintLimit': 3,
        'active': True,
        'subject': 'Data Structures',
        'classId': 'CS-2-A',
        'starterCode': 'def factorial(n):\n    # your code here\n    pass\n\nn = int(input())\nprint(factorial(n))',
        'testCases': [
            {'label': 'n=5', 'input': '5', 'expectedOutput': '120'},
            {'label': 'n=0', 'input': '0', 'expectedOutput': '1'},
        ],
    },
    {
        'title': 'Bubble Sort',
        'description': 'Sort a list of integers using bubble sort.',
        'language': 'python',
        'difficulty': 'medium',
        'concepts': ['loops', 'arrays', 'logic'],
        'hintLimit': 3,
        'active': True,
        'subject': 'Data Structures',
        'classId': 'CS-2-A',
        'starterCode': 'arr = list(map(int, input().split()))\n# your code here',
        'testCases': [
            {'label': 'basic', 'input': '5 3 8 1 2', 'expectedOutput': '1 2 3 5 8'},
        ],
    },
    {
        'title': 'Prime Number Check',
        'description': 'Check if a number is prime.',
        'language': 'python',
        'difficulty': 'medium',
        'concepts': ['loops', 'logic', 'math'],
        'hintLimit': 3,
        'active': True,
        'subject': 'Programming Fundamentals',
        'classId': 'CS-2-A',
        'starterCode': 'n = int(input())\n# your code here',
        'testCases': [
            {'label': 'prime', 'input': '17', 'expectedOutput': 'True'},
            {'label': 'not prime', 'input': '15', 'expectedOutput': 'False'},
        ],
    }
]

program_ids = {}
for prog in programs_data:
    doc_ref = db.collection('programs').add(prog)
    program_ids[prog['title']] = doc_ref[1].id
    print(f"Added program: {prog['title']} (ID: {doc_ref[1].id})")

# ── Generate Sessions with Realistic Data ──────────────────────
def generate_session_data(student_uid, student_name, program_id, program_title, days_ago, attempt_num=1):
    """Generate realistic session data with completion and reports"""
    
    # Base timestamp
    base_time = datetime.now() - timedelta(days=days_ago)
    started_at = base_time
    
    # Simulate different performance levels
    performance_profiles = {
        'Arjun Patel': {'quiz_range': (70, 90), 'time_range': (15, 25), 'hints_range': (0, 2)},
        'Priya Nair': {'quiz_range': (85, 100), 'time_range': (10, 18), 'hints_range': (0, 1)},
        'Rohan Mehta': {'quiz_range': (60, 80), 'time_range': (20, 35), 'hints_range': (1, 3)},
        'Ananya Singh': {'quiz_range': (80, 95), 'time_range': (12, 22), 'hints_range': (0, 2)},
        'Kiran Kumar': {'quiz_range': (65, 85), 'time_range': (18, 30), 'hints_range': (1, 2)},
        'Maya Reddy': {'quiz_range': (75, 90), 'time_range': (14, 24), 'hints_range': (0, 2)}
    }
    
    profile = performance_profiles.get(student_name, {'quiz_range': (60, 85), 'time_range': (15, 30), 'hints_range': (0, 3)})
    
    quiz_score = random.randint(*profile['quiz_range'])
    time_minutes = random.randint(*profile['time_range'])
    hints_used = random.randint(*profile['hints_range'])
    run_attempts = random.randint(3, 12)
    
    # Generate realistic code based on program
    code_samples = {
        'Fibonacci Series': '''n = int(input())
a, b = 0, 1
result = []
for i in range(n):
    result.append(str(a))
    a, b = b, a + b
print(' '.join(result))''',
        
        'Linear Search': '''arr = list(map(int, input().split()))
target = int(input())
for i in range(len(arr)):
    if arr[i] == target:
        print(i)
        break
else:
    print(-1)''',
        
        'Factorial using Recursion': '''def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n-1)

n = int(input())
print(factorial(n))''',
        
        'Bubble Sort': '''arr = list(map(int, input().split()))
n = len(arr)
for i in range(n):
    for j in range(0, n-i-1):
        if arr[j] > arr[j+1]:
            arr[j], arr[j+1] = arr[j+1], arr[j]
print(' '.join(map(str, arr)))''',
        
        'Prime Number Check': '''n = int(input())
if n < 2:
    print("False")
else:
    is_prime = True
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            is_prime = False
            break
    print(str(is_prime))'''
    }
    
    final_code = code_samples.get(program_title, '# Code solution here')
    
    # Generate performance tier based on quiz score
    if quiz_score >= 85:
        tier = 'excellent'
        weakness = random.choice(['None', 'Minor syntax issues'])
    elif quiz_score >= 70:
        tier = 'satisfactory'
        weakness = random.choice(['Logic optimization', 'Code structure', 'Algorithm efficiency'])
    else:
        tier = 'needs_attention'
        weakness = random.choice(['Basic concepts', 'Syntax errors', 'Problem understanding', 'Logic flow'])
    
    # Generate violations (some sessions might have them)
    violations = []
    flagged = False
    if random.random() < 0.15:  # 15% chance of violations
        violation_types = [
            {'type': 'tab_switch', 'timestamp': started_at.isoformat(), 'details': 'Switched to different tab'},
            {'type': 'copy_paste', 'timestamp': started_at.isoformat(), 'details': 'Potential copy-paste detected'},
            {'type': 'unusual_typing', 'timestamp': started_at.isoformat(), 'details': 'Unusual typing pattern detected'}
        ]
        violations = random.sample(violation_types, random.randint(1, 2))
        flagged = len(violations) >= 2
    
    # Generate quiz answers
    quiz_answers = []
    for i in range(5):  # Assuming 5 quiz questions
        is_correct = random.random() < (quiz_score / 100)
        quiz_answers.append({
            'questionId': f'q{i+1}',
            'answer': random.choice(['A', 'B', 'C', 'D']),
            'correct': is_correct,
            'timeSpent': random.randint(10, 60)
        })
    
    return {
        'studentId': student_uid,
        'programId': program_id,
        'attemptNumber': attempt_num,
        'status': 'complete',
        'startedAt': started_at,
        'completedAt': started_at + timedelta(minutes=time_minutes),
        'timeTakenMs': time_minutes * 60 * 1000,
        'finalCode': final_code,
        'quizScore': quiz_score,
        'quizAnswers': quiz_answers,
        'hintsUsed': hints_used,
        'runAttempts': run_attempts,
        'violations': violations,
        'flagged': flagged,
        'errors': [],  # Most completed sessions have resolved errors
        'report': {
            'performanceTier': tier,
            'dominantWeakness': weakness,
            'teacherSummary': f"Student {'excelled in' if tier == 'excellent' else 'completed' if tier == 'satisfactory' else 'struggled with'} {program_title}. {'No significant issues noted.' if tier == 'excellent' else f'Areas for improvement: {weakness}.' if tier == 'satisfactory' else f'Needs focused attention on {weakness}.'}",
            'plagiarismScore': random.randint(0, 25),
            'plagiarismFlagged': False,
            'codeQualityScore': random.randint(70, 95) if tier == 'excellent' else random.randint(50, 80) if tier == 'satisfactory' else random.randint(30, 70),
            'conceptUnderstanding': random.randint(75, 95) if tier == 'excellent' else random.randint(60, 85) if tier == 'satisfactory' else random.randint(40, 70)
        }
    }

# ── Generate Comprehensive Session Data ─────────────────────────
print("\nGenerating session data...")

session_scenarios = [
    # Recent sessions (last 7 days)
    ('Priya Nair', 'Fibonacci Series', 1),
    ('Priya Nair', 'Linear Search', 2), 
    ('Arjun Patel', 'Fibonacci Series', 1),
    ('Rohan Mehta', 'Fibonacci Series', 3),  # Multiple attempts
    ('Ananya Singh', 'Linear Search', 1),
    ('Maya Reddy', 'Fibonacci Series', 2),
    
    # Medium-term sessions (1-2 weeks ago)
    ('Priya Nair', 'Factorial using Recursion', 8),
    ('Arjun Patel', 'Linear Search', 9),
    ('Rohan Mehta', 'Linear Search', 10),
    ('Ananya Singh', 'Fibonacci Series', 11),
    ('Kiran Kumar', 'Fibonacci Series', 12),
    ('Maya Reddy', 'Linear Search', 13),
    
    # Older sessions (2-4 weeks ago)
    ('Priya Nair', 'Bubble Sort', 15),
    ('Arjun Patel', 'Factorial using Recursion', 16),
    ('Rohan Mehta', 'Factorial using Recursion', 18),
    ('Ananya Singh', 'Bubble Sort', 20),
    ('Kiran Kumar', 'Linear Search', 22),
    ('Maya Reddy', 'Factorial using Recursion', 25),
    
    # Historical sessions (1-2 months ago)
    ('Priya Nair', 'Prime Number Check', 30),
    ('Arjun Patel', 'Bubble Sort', 32),
    ('Rohan Mehta', 'Prime Number Check', 35),
    ('Ananya Singh', 'Prime Number Check', 38),
    ('Kiran Kumar', 'Bubble Sort', 40),
    ('Maya Reddy', 'Prime Number Check', 42)
]

for student_name, program_title, days_ago in session_scenarios:
    if student_name in student_uids and program_title in program_ids:
        student_uid = student_uids[student_name]
        program_id = program_ids[program_title]
        
        session_data = generate_session_data(
            student_uid, student_name, program_id, program_title, days_ago
        )
        
        # Add to Firestore
        doc_ref = db.collection('sessions').add(session_data)
        print(f"Added session: {student_name} - {program_title} ({days_ago} days ago)")

# ── Add some in-progress sessions ──────────────────────────────
print("\nAdding in-progress sessions...")
in_progress_sessions = [
    ('Rohan Mehta', 'Bubble Sort', 0),  # Current session
    ('Kiran Kumar', 'Prime Number Check', 1),  # Yesterday's session
]

for student_name, program_title, days_ago in in_progress_sessions:
    if student_name in student_uids and program_title in program_ids:
        student_uid = student_uids[student_name]
        program_id = program_ids[program_title]
        
        session_data = {
            'studentId': student_uid,
            'programId': program_id,
            'status': 'in_progress',
            'startedAt': datetime.now() - timedelta(days=days_ago),
            'currentCode': program_title.replace(' ', '').lower() + ' = input()\n# Working on solution...',
            'runAttempts': random.randint(1, 5),
            'hintsUsed': random.randint(0, 2),
            'violations': [],
            'flagged': False
        }
        
        doc_ref = db.collection('sessions').add(session_data)
        print(f"Added in-progress session: {student_name} - {program_title}")

print('\nEnhanced seeding complete!')
print('=' * 60)
print('LOGIN CREDENTIALS:')
print('Teacher: teacher@lab.com / teacher123')
print('Students:')
for student in students_data:
    print(f"  {student['name']}: {student['email']} / student123")

print('\nDATA SUMMARY:')
print(f"- {len(students_data)} students with diverse performance profiles")
print(f"- {len(programs_data)} programming challenges")
print(f"- {len(session_scenarios)} completed sessions with reports")
print(f"- {len(in_progress_sessions)} in-progress sessions")
print("- Realistic quiz scores, completion times, and performance analytics")
print("- Generated violations and flagged sessions for testing")
print("- Complete learning timeline for each student")