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

# ── Create test users ──────────────────────────────────────────
def create_user(email, password, name, role, extra={}):
    try:
        user = auth.create_user(email=email, password=password)
        db.collection('users').document(user.uid).set({
            'uid':       user.uid,
            'email':     email,
            'name':      name,
            'role':      role,
            'streak':    0,
            'badges':    [],
            'createdAt': firestore.SERVER_TIMESTAMP,  # FIX BUG 5: write createdAt
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

# ── Create sample programs ─────────────────────────────────────
# FIX BUG 3: all programs now have classId and subject so ProgramLibrary shows them
programs = [
    {
        'title':       'Fibonacci Series',
        'description': 'Print the Fibonacci series up to N terms.',
        'language':    'python',
        'difficulty':  'easy',
        'concepts':    ['loops', 'variables'],
        'hintLimit':   3,
        'active':      True,
        'subject':     'Programming Fundamentals',   # FIX BUG 3
        'classId':     'CS-2-A',                     # FIX BUG 3
        'starterCode': 'n = int(input())\n# your code here',
        'testCases':   [
            {'label': 'n=5',  'input': '5',  'expectedOutput': '0 1 1 2 3'},
            {'label': 'n=1',  'input': '1',  'expectedOutput': '0'},
            {'label': 'n=7',  'input': '7',  'expectedOutput': '0 1 1 2 3 5 8'},
        ],
    },
    {
        'title':       'Linear Search',
        'description': 'Implement linear search on a list of integers. Print the index (0-based) or -1 if not found.',
        'language':    'python',
        'difficulty':  'easy',
        'concepts':    ['loops', 'arrays'],
        'hintLimit':   3,
        'active':      True,
        'subject':     'Programming Fundamentals',
        'classId':     'CS-2-A',
        'starterCode': 'arr = list(map(int, input().split()))\ntarget = int(input())\n# your code here',
        'testCases':   [
            {'label': 'found',   'input': '3 1 4 1 5\n4', 'expectedOutput': '2'},
            {'label': 'missing', 'input': '1 2 3\n9',     'expectedOutput': '-1'},
        ],
    },
    {
        'title':       'Factorial using Recursion',
        'description': 'Compute factorial of N using a recursive function.',
        'language':    'python',
        'difficulty':  'medium',
        'concepts':    ['recursion', 'functions'],
        'hintLimit':   3,
        'active':      True,
        'subject':     'Data Structures',
        'classId':     'CS-2-A',
        'starterCode': 'def factorial(n):\n    # your code here\n    pass\n\nn = int(input())\nprint(factorial(n))',
        'testCases':   [
            {'label': 'n=5', 'input': '5', 'expectedOutput': '120'},
            {'label': 'n=0', 'input': '0', 'expectedOutput': '1'},
            {'label': 'n=7', 'input': '7', 'expectedOutput': '5040'},
        ],
    },
    {
        'title':       'Bubble Sort',
        'description': 'Sort a list of integers using the bubble sort algorithm. Print space-separated sorted list.',
        'language':    'python',
        'difficulty':  'medium',
        'concepts':    ['loops', 'arrays', 'logic'],
        'hintLimit':   3,
        'active':      True,
        'subject':     'Data Structures',
        'classId':     'CS-2-A',
        'starterCode': 'arr = list(map(int, input().split()))\n# your code here',
        'testCases':   [
            {'label': 'basic',   'input': '5 3 8 1 2',  'expectedOutput': '1 2 3 5 8'},
            {'label': 'sorted',  'input': '1 2 3',      'expectedOutput': '1 2 3'},
            {'label': 'reverse', 'input': '9 7 5 3 1',  'expectedOutput': '1 3 5 7 9'},
        ],
    },
    {
        'title':       'Palindrome Checker',
        'description': 'Check whether a given string is a palindrome. Print True or False.',
        'language':    'python',
        'difficulty':  'easy',
        'concepts':    ['strings', 'logic'],
        'hintLimit':   3,
        'active':      True,
        'subject':     'Programming Fundamentals',
        'classId':     'CS-2-A',
        'starterCode': 's = input()\n# your code here',
        'testCases':   [
            {'label': 'palindrome',     'input': 'racecar', 'expectedOutput': 'True'},
            {'label': 'not palindrome', 'input': 'hello',   'expectedOutput': 'False'},
            {'label': 'single char',    'input': 'a',       'expectedOutput': 'True'},
        ],
    },
    # Extra programs for class B
    {
        'title':       'Fibonacci Series',
        'description': 'Print the Fibonacci series up to N terms.',
        'language':    'python',
        'difficulty':  'easy',
        'concepts':    ['loops', 'variables'],
        'hintLimit':   3,
        'active':      True,
        'subject':     'Programming Fundamentals',
        'classId':     'CS-2-B',
        'starterCode': 'n = int(input())\n# your code here',
        'testCases':   [
            {'label': 'n=5', 'input': '5', 'expectedOutput': '0 1 1 2 3'},
        ],
    },
]

for prog in programs:
    db.collection('programs').add(prog)
    print(f"Added program: {prog['title']} ({prog.get('classId', 'no class')})")

print('\nSeeding complete!')
print('Teacher login:  teacher@lab.com  /  teacher123')
print('Student login:  student1@lab.com /  student123  (class CS-2-A)')
print('Student login:  student3@lab.com /  student123  (class CS-2-B)')
