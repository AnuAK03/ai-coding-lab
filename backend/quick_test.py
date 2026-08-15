# backend/quick_test.py
# Quick automated test for real-time features
# Run: python quick_test.py

import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv
from datetime import datetime
import random

print("🚀 QUICK REAL-TIME FEATURE TEST")
print("=" * 60)

load_dotenv()

# Initialize Firebase
if not firebase_admin._apps:
    cred = credentials.Certificate(os.getenv('FIREBASE_KEY_PATH'))
    firebase_admin.initialize_app(cred)

db = firestore.client()

print("\n📊 Checking Database Contents...")

# Check students
students = db.collection('users').where('role', '==', 'student').get()
print(f"✅ Found {len(students)} students")

# Check programs  
programs = db.collection('programs').get()
print(f"✅ Found {len(programs)} programs")

# Check sessions
sessions = db.collection('sessions').get()
print(f"✅ Found {len(sessions)} sessions")

# Show sample data
print("\n👥 Sample Students:")
for i, student_doc in enumerate(students[:3], 1):
    student = student_doc.to_dict()
    print(f"  {i}. {student.get('name', 'Unknown')} - Streak: {student.get('streak', 0)} days")

print("\n💻 Available Programs:")
program_list = []
for i, prog_doc in enumerate(programs[:5], 1):
    prog = prog_doc.to_dict()
    title = prog.get('title', 'Unknown')
    print(f"  {i}. {title}")
    program_list.append({'id': prog_doc.id, **prog})

# Check for in-progress sessions
in_progress = [s for s in sessions if s.to_dict().get('status') == 'in_progress']
print(f"\n🟢 Currently Active Sessions: {len(in_progress)}")

if in_progress:
    print("   Active students:")
    for session_doc in in_progress[:3]:
        session = session_doc.to_dict()
        student_id = session.get('studentId', '')
        program_id = session.get('programId', '')
        
        # Get student name
        try:
            student = db.collection('users').document(student_id).get()
            student_name = student.to_dict().get('name', 'Unknown') if student.exists else 'Unknown'
        except:
            student_name = 'Unknown'
        
        # Get program title
        try:
            program = db.collection('programs').document(program_id).get()
            program_title = program.to_dict().get('title', 'Unknown') if program.exists else 'Unknown'
        except:
            program_title = 'Unknown'
        
        print(f"   - {student_name}: {program_title}")

# Create a test activity
print("\n🎬 Creating Test Activity...")
if students and program_list:
    # Select random student and program
    test_student = random.choice([{'id': doc.id, **doc.to_dict()} for doc in students])
    test_program = random.choice(program_list)
    
    # Create in-progress session
    session_data = {
        'studentId': test_student['id'],
        'programId': test_program['id'],
        'status': 'in_progress',
        'startedAt': datetime.now(),
        'currentCode': f'# Testing real-time updates\nprint("Hello from {test_student.get("name")}")',
        'runAttempts': 1,
        'hintsUsed': 0,
        'violations': [],
        'flagged': False
    }
    
    doc_ref = db.collection('sessions').add(session_data)
    session_id = doc_ref[1].id
    
    print(f"✅ Created test session for: {test_student.get('name', 'Unknown')}")
    print(f"   Program: {test_program.get('title', 'Unknown')}")
    print(f"   Session ID: {session_id}")
    print(f"   Status: 🟢 IN PROGRESS (Coding)")
    
    print("\n📺 CHECK THE TEACHER DASHBOARD NOW!")
    print(f"   - Look for {test_student.get('name', 'Unknown')}")
    print(f"   - Should show green pulsing dot")
    print(f"   - Program: {test_program.get('title', 'Unknown')}")
    print(f"   - Status: Coding")
else:
    print("⚠️  No students or programs available for testing")

print("\n" + "=" * 60)
print("✅ TEST COMPLETE!")
print("\n💡 Next Steps:")
print("1. Open Teacher Dashboard (http://localhost:5173)")
print("2. Login as teacher@lab.com / teacher123")
print("3. Navigate to 'Students' page")
print("4. Look for the test student - should see real-time status!")
print("\n🔄 Run this script again to create more test activities")
