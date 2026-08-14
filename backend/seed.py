# backend/seed.py
# Run once: python seed.py
# Creates test users and sample programs in Firestore

import firebase_admin
from firebase_admin import credentials, auth, firestore
import os
from dotenv import load_dotenv

print("SEED SCRIPT STARTED")
load_dotenv()
cred = credentials.Certificate(os.getenv('FIREBASE_KEY_PATH'))
firebase_admin.initialize_app(cred)
db = firestore.client()

# ── Create test users ──
def create_user(email, password, name, role, extra={}):
    try:
        user = auth.create_user(email=email, password=password)
        db.collection('users').document(user.uid).set({
            'uid':    user.uid,
            'email':  email,
            'name':   name,
            'role':   role,
            'streak': 0,
            'badges': [],
            **extra
        })
        print(f'Created {role}: {email}')
    except Exception as e:
        print(f'User may already exist: {email} — {e}')

create_user('teacher@lab.com', 'teacher123', 'Prof. Sharma',
            'teacher', {'department': 'Computer Science'})

create_user('student1@lab.com', 'student123', 'Arjun Patel',
    'student', {
        'rollNumber': 'CS001', 'department': 'Computer Science',
        'year': 2, 'section': 'A', 'classId': 'CS-2-A',
    })

create_user('student2@lab.com', 'student123', 'Priya Nair',
    'student', {
        'rollNumber': 'CS002', 'department': 'Computer Science',
        'year': 2, 'section': 'A', 'classId': 'CS-2-A',
    })

create_user('student3@lab.com', 'student123', 'Rohan Mehta',
    'student', {
        'rollNumber': 'CS003', 'department': 'Computer Science',
        'year': 2, 'section': 'B', 'classId': 'CS-2-B',
    })

# ── Create sample programs ──
programs = [
    {
        'title':       'Fibonacci Series',
        'description': 'Print the Fibonacci series up to N terms.',
        'language':    'python',
        'difficulty':  'easy',
        'concepts':    ['loops', 'variables'],
        'hintLimit':   3,
        'active':      True,
        'starterCode': 'n = int(input())\n# your code here',
    },
    {
        'title':       'Linear Search',
        'description': 'Implement linear search on a list of integers.',
        'language':    'python',
        'difficulty':  'easy',
        'concepts':    ['loops', 'arrays'],
        'hintLimit':   3,
        'active':      True,
        'starterCode': 'arr = list(map(int, input().split()))\n# your code here',
    },
    {
        'title':       'Factorial using Recursion',
        'description': 'Compute factorial of N using a recursive function.',
        'language':    'python',
        'difficulty':  'medium',
        'concepts':    ['recursion', 'functions'],
        'hintLimit':   3,
        'active':      True,
        'starterCode': 'def factorial(n):\n    # your code here\n    pass',
    },
    {
        'title':       'Bubble Sort',
        'description': 'Sort a list of integers using the bubble sort algorithm.',
        'language':    'python',
        'difficulty':  'medium',
        'concepts':    ['loops', 'arrays', 'logic'],
        'hintLimit':   3,
        'active':      True,
        'starterCode': 'arr = list(map(int, input().split()))\n# your code here',
    },
    {
        'title':       'Palindrome Checker',
        'description': 'Check whether a given string is a palindrome.',
        'language':    'python',
        'difficulty':  'easy',
        'concepts':    ['strings', 'logic'],
        'hintLimit':   3,
        'active':      True,
        'starterCode': 's = input()\n# your code here',
    },
]

for prog in programs:
    db.collection('programs').add(prog)
    print(f"Added program: {prog['title']}")

print('\nSeeding complete!')
print('Teacher login:  teacher@lab.com  /  teacher123')
print('Student login:  student1@lab.com /  student123')