# backend/simulate_activity.py
# Simulate student activity to test real-time updates in the teacher dashboard
# Run: python simulate_activity.py

import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv
from datetime import datetime
import time
import random

print("🎬 REAL-TIME ACTIVITY SIMULATOR")
print("=" * 60)

load_dotenv()

# Initialize Firebase if not already initialized
if not firebase_admin._apps:
    cred = credentials.Certificate(os.getenv('FIREBASE_KEY_PATH'))
    firebase_admin.initialize_app(cred)

db = firestore.client()

def get_random_student():
    """Get a random student from the database"""
    students = db.collection('users').where('role', '==', 'student').limit(10).get()
    students_list = [{'id': doc.id, **doc.to_dict()} for doc in students]
    if not students_list:
        print("❌ No students found in database!")
        return None
    return random.choice(students_list)

def get_random_program():
    """Get a random program from the database"""
    programs = db.collection('programs').where('active', '==', True).limit(10).get()
    programs_list = [{'id': doc.id, **doc.to_dict()} for doc in programs]
    if not programs_list:
        print("❌ No programs found in database!")
        return None
    return random.choice(programs_list)

def create_in_progress_session(student, program):
    """Create a new in-progress session to simulate student coding"""
    session_data = {
        'studentId': student['id'],
        'programId': program['id'],
        'status': 'in_progress',
        'startedAt': datetime.now(),
        'currentCode': f'# {student["name"]} is working on {program["title"]}\n\n# Solution in progress...',
        'runAttempts': random.randint(1, 3),
        'hintsUsed': random.randint(0, 1),
        'violations': [],
        'flagged': False
    }
    
    doc_ref = db.collection('sessions').add(session_data)
    return doc_ref[1].id

def update_session_progress(session_id, progress_stage):
    """Update session to simulate coding progress"""
    updates = {}
    
    if progress_stage == 'coding':
        updates = {
            'currentCode': '# Making good progress\n\ndef solve():\n    # Logic here\n    pass',
            'runAttempts': firestore.Increment(1)
        }
    elif progress_stage == 'testing':
        updates = {
            'currentCode': '# Testing solution\n\ndef solve(n):\n    result = []\n    a, b = 0, 1\n    for i in range(n):\n        result.append(a)\n        a, b = b, a + b\n    return result',
            'runAttempts': firestore.Increment(1)
        }
    elif progress_stage == 'complete':
        updates = {
            'status': 'complete',
            'completedAt': datetime.now(),
            'quizScore': random.randint(70, 100),
            'quizAnswers': [
                {'questionId': f'q{i}', 'answer': 'A', 'correct': random.choice([True, False])}
                for i in range(1, 6)
            ],
            'finalCode': '# Final solution\n\ndef fibonacci(n):\n    result = []\n    a, b = 0, 1\n    for i in range(n):\n        result.append(a)\n        a, b = b, a + b\n    return result',
            'report': {
                'performanceTier': 'excellent',
                'dominantWeakness': 'None',
                'teacherSummary': 'Great work on this problem!',
                'plagiarismScore': 0,
                'plagiarismFlagged': False
            }
        }
    
    db.collection('sessions').document(session_id).update(updates)

def simulate_violation(session_id):
    """Add a violation to test integrity monitoring"""
    violation = {
        'type': 'tab_switch',
        'timestamp': datetime.now().isoformat(),
        'details': 'Student switched to a different tab'
    }
    
    db.collection('sessions').document(session_id).update({
        'violations': firestore.ArrayUnion([violation])
    })

def run_simulation():
    """Run a complete activity simulation"""
    print("\n📚 Starting real-time activity simulation...")
    print("📺 Open the Teacher Dashboard to see updates in real-time!\n")
    
    # Select random student and program
    student = get_random_student()
    if not student:
        return
    
    program = get_random_program()
    if not program:
        return
    
    print(f"👤 Selected Student: {student.get('name', 'Unknown')}")
    print(f"💻 Selected Program: {program.get('title', 'Unknown')}")
    print(f"🔗 Student ID: {student['id']}")
    print(f"\n⏱️  Simulating activity stages...\n")
    
    # Stage 1: Start session
    print("1️⃣  [00:00] Student starts coding session...")
    session_id = create_in_progress_session(student, program)
    print(f"   ✅ Session created: {session_id}")
    print("   🟢 Status: CODING (should show green pulsing dot)\n")
    time.sleep(3)
    
    # Stage 2: Making progress
    print("2️⃣  [00:30] Student writing code...")
    update_session_progress(session_id, 'coding')
    print("   ✅ Code progress updated")
    print("   📊 Run attempts increased\n")
    time.sleep(3)
    
    # Stage 3: Testing solution
    print("3️⃣  [02:15] Student testing solution...")
    update_session_progress(session_id, 'testing')
    print("   ✅ Test runs recorded\n")
    time.sleep(2)
    
    # Stage 4: Optional violation (50% chance)
    if random.random() < 0.5:
        print("4️⃣  [03:00] 🚨 Integrity violation detected!")
        simulate_violation(session_id)
        print("   ⚠️  Tab switch violation logged")
        print("   🔴 Should show violation warning in dashboard\n")
        time.sleep(2)
    else:
        print("4️⃣  [03:00] ✅ No violations detected\n")
    
    # Stage 5: Complete session
    print("5️⃣  [05:00] Student completing session...")
    update_session_progress(session_id, 'complete')
    print("   ✅ Session completed!")
    print("   🎯 Quiz score generated")
    print("   📄 Report created")
    print("   🔵 Status: ACTIVE (no longer pulsing)\n")
    
    print("=" * 60)
    print("✨ SIMULATION COMPLETE!")
    print(f"📊 Check the Teacher Dashboard for {student.get('name')}")
    print("🔄 The student's status should have changed from CODING to ACTIVE")
    print("\n💡 Tip: Run this script again to simulate another student's activity!")

def interactive_mode():
    """Interactive mode for manual testing"""
    print("\n🎮 INTERACTIVE MODE")
    print("=" * 60)
    
    while True:
        print("\nChoose an action:")
        print("1. Simulate complete session (auto)")
        print("2. Create in-progress session")
        print("3. Add violation to random session")
        print("4. Complete random in-progress session")
        print("5. Exit")
        
        choice = input("\nEnter choice (1-5): ").strip()
        
        if choice == '1':
            run_simulation()
        elif choice == '2':
            student = get_random_student()
            program = get_random_program()
            if student and program:
                session_id = create_in_progress_session(student, program)
                print(f"\n✅ Created in-progress session for {student.get('name')}")
                print(f"📝 Session ID: {session_id}")
                print(f"💻 Program: {program.get('title')}")
        elif choice == '3':
            sessions = db.collection('sessions').where('status', '==', 'in_progress').limit(1).get()
            if sessions:
                session = sessions[0]
                simulate_violation(session.id)
                print(f"\n⚠️  Added violation to session: {session.id}")
            else:
                print("\n❌ No in-progress sessions found")
        elif choice == '4':
            sessions = db.collection('sessions').where('status', '==', 'in_progress').limit(1).get()
            if sessions:
                session = sessions[0]
                update_session_progress(session.id, 'complete')
                print(f"\n✅ Completed session: {session.id}")
            else:
                print("\n❌ No in-progress sessions found")
        elif choice == '5':
            print("\n👋 Goodbye!")
            break
        else:
            print("\n❌ Invalid choice")

if __name__ == "__main__":
    print("\nSelect mode:")
    print("1. Auto simulation (recommended)")
    print("2. Interactive mode")
    
    mode = input("\nEnter choice (1-2): ").strip()
    
    if mode == '1':
        run_simulation()
    elif mode == '2':
        interactive_mode()
    else:
        print("Running auto simulation by default...")
        run_simulation()
