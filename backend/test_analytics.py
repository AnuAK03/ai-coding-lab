# backend/test_analytics.py
# Test script to demonstrate analytics functionality
# Run: python test_analytics.py

import requests
import json
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:8000/api"

def test_reports_endpoints():
    """Test all the report generation endpoints"""
    print("🧪 TESTING ANALYTICS ENDPOINTS")
    print("=" * 50)
    
    # Test class analytics
    print("\n📊 Testing Class Analytics...")
    try:
        response = requests.get(f"{BASE_URL}/reports/class")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Class Analytics Success!")
            print(f"   Total Sessions: {data.get('total', 0)}")
            print(f"   Average Quiz Score: {data.get('avgQuizScore', 0)}%")
            print(f"   Flagged Sessions: {data.get('flagged', 0)}")
            
            tiers = data.get('tiers', {})
            print(f"   Performance Distribution:")
            print(f"     🟢 Excellent: {tiers.get('excellent', 0)}")
            print(f"     🟡 Satisfactory: {tiers.get('satisfactory', 0)}")
            print(f"     🔴 Needs Attention: {tiers.get('needs_attention', 0)}")
        else:
            print(f"❌ Class Analytics Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Class Analytics Error: {str(e)}")
    
    # Test recent sessions
    print("\n📋 Testing Recent Sessions...")
    try:
        response = requests.get(f"{BASE_URL}/reports/sessions/recent")
        if response.status_code == 200:
            data = response.json()
            sessions = data.get('sessions', [])
            print(f"✅ Recent Sessions Success!")
            print(f"   Retrieved {len(sessions)} recent sessions")
            
            if sessions:
                print(f"   Sample Session:")
                session = sessions[0]
                print(f"     Student: {session.get('studentName', 'N/A')}")
                print(f"     Program: {session.get('programTitle', 'N/A')}")
                print(f"     Score: {session.get('quizScore', 0)}%")
                print(f"     Status: {session.get('status', 'N/A')}")
                print(f"     Flagged: {'Yes' if session.get('flagged') else 'No'}")
        else:
            print(f"❌ Recent Sessions Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Recent Sessions Error: {str(e)}")
    
    # Test student timeline (using a known student ID from our seed data)
    print("\n👤 Testing Student Timeline...")
    try:
        # We'll use the first student from our enhanced seed data
        # You would normally get this from authentication or user selection
        student_ids = [
            "09QdVVSgLEYhIV9WTL44gHS2pLE3",  # Arjun Patel
            "iMQBMn8OGFZMhUeOgASj7XuSVJ93",  # Priya Nair
        ]
        
        for student_id in student_ids:
            response = requests.get(f"{BASE_URL}/student/{student_id}/timeline")
            if response.status_code == 200:
                data = response.json()
                student_info = data.get('student', {})
                timeline = data.get('timeline', [])
                summary = data.get('summary', {})
                
                print(f"✅ Student Timeline Success for {student_info.get('name', 'Unknown')}!")
                print(f"   Roll Number: {student_info.get('rollNumber', 'N/A')}")
                print(f"   Class: {student_info.get('classId', 'N/A')}")
                print(f"   Streak: {student_info.get('streak', 0)} days")
                print(f"   Total Attempts: {summary.get('totalAttempts', 0)}")
                print(f"   Completed: {summary.get('completedCount', 0)}")
                print(f"   Average Score: {summary.get('avgQuizScore', 0)}%")
                print(f"   Violations: {summary.get('totalViolations', 0)}")
                
                if timeline:
                    print(f"   Recent Activity:")
                    for session in timeline[:3]:  # Show last 3 sessions
                        print(f"     • {session.get('programTitle', 'N/A')} - {session.get('quizScore', 0)}% ({session.get('status', 'N/A')})")
                break
            else:
                print(f"❌ Student Timeline Failed for {student_id}: {response.status_code}")
    except Exception as e:
        print(f"❌ Student Timeline Error: {str(e)}")

def test_session_endpoints():
    """Test session-related endpoints"""
    print("\n🔧 TESTING SESSION ENDPOINTS")
    print("=" * 50)
    
    # Test code execution
    print("\n▶️ Testing Code Execution...")
    try:
        test_code = {
            "code": "print('Hello from AI Coding Lab!')",
            "language": "python"
        }
        response = requests.post(f"{BASE_URL}/session/run", json=test_code)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Code Execution Success!")
            print(f"   Output: {result.get('stdout', '').strip()}")
            print(f"   Exit Code: {result.get('exitCode', 1)}")
            print(f"   Execution Time: {result.get('tookMs', 0)}ms")
        else:
            print(f"❌ Code Execution Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Code Execution Error: {str(e)}")
    
    # Test test case runner
    print("\n✅ Testing Test Case Runner...")
    try:
        test_data = {
            "code": "n = int(input())\nresult = []\na, b = 0, 1\nfor i in range(n):\n    result.append(str(a))\n    a, b = b, a + b\nprint(' '.join(result))",
            "language": "python",
            "testCases": [
                {"input": "5", "expectedOutput": "0 1 1 2 3", "label": "n=5"},
                {"input": "3", "expectedOutput": "0 1 1", "label": "n=3"}
            ]
        }
        response = requests.post(f"{BASE_URL}/session/run-tests", json=test_data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Test Runner Success!")
            print(f"   Passed: {result.get('passedCount', 0)}/{result.get('totalCount', 0)} tests")
            
            for test_result in result.get('results', []):
                status = "✅" if test_result.get('passed') else "❌"
                print(f"   {status} {test_result.get('label', 'Test')}: {test_result.get('passed')}")
        else:
            print(f"❌ Test Runner Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Test Runner Error: {str(e)}")

def display_summary():
    """Display a summary of the testing data"""
    print("\n📈 DATA SUMMARY")
    print("=" * 50)
    
    try:
        # Read the generated reports
        with open('summary_report.json', 'r') as f:
            summary = json.load(f)
        
        print(f"📊 Generated Report Summary:")
        print(f"   Report Generated: {summary.get('generation_time', 'Unknown')}")
        
        class_summary = summary.get('class_summary', {})
        print(f"   Total Sessions: {class_summary.get('total_sessions', 0)}")
        print(f"   Class Average: {class_summary.get('average_quiz_score', 0)}%")
        print(f"   Flagged Sessions: {class_summary.get('flagged_sessions', 0)} ({class_summary.get('flagged_percentage', 0)}%)")
        
        print(f"\n🏆 Top Performers:")
        for i, performer in enumerate(summary.get('top_performers', [])[:3], 1):
            print(f"   {i}. {performer.get('name', 'Unknown')} - {performer.get('avg_score', 0)}% ({performer.get('sessions', 0)} sessions)")
        
        attention_students = summary.get('students_needing_attention', [])
        if attention_students:
            print(f"\n⚠️ Students Needing Attention:")
            for student in attention_students:
                print(f"   • {student.get('name', 'Unknown')} - {student.get('avg_score', 0)}% (Weakness: {student.get('weakness', 'N/A')})")
    
    except FileNotFoundError:
        print("❌ Summary report not found. Run generate_reports.py first.")
    except Exception as e:
        print(f"❌ Error reading summary: {str(e)}")

def main():
    """Main testing function"""
    print("🚀 AI CODING LAB - ANALYTICS TESTING SUITE")
    print("=" * 60)
    print(f"Test Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    print("\n⚠️ Note: Make sure the FastAPI server is running on localhost:8000")
    print("   Start server with: uvicorn main:app --reload")
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ API Server is running!")
        else:
            print("❌ API Server responded with error")
            return
    except Exception as e:
        print("❌ API Server is not responding. Please start the server first.")
        print("   Command: cd backend && uvicorn main:app --reload")
        return
    
    # Run tests
    test_reports_endpoints()
    test_session_endpoints()
    display_summary()
    
    print(f"\n🎉 Testing Complete!")
    print("=" * 60)
    
    # Provide next steps
    print("\n📋 NEXT STEPS FOR TESTING:")
    print("1. 🌐 Start the frontend: cd frontend && npm run dev")
    print("2. 🔑 Login as teacher: teacher@lab.com / teacher123")
    print("3. 👥 View student reports and class analytics in the dashboard")
    print("4. 🎓 Login as student: priya.nair@lab.com / student123")
    print("5. 📊 Check personal progress and attempt programming challenges")
    
    print("\n📁 Generated Files:")
    print("• class_analytics_report.json - Detailed class analytics")
    print("• student_reports.json - Individual student reports")
    print("• summary_report.json - Executive summary")

if __name__ == "__main__":
    main()