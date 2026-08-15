# 🧪 Real-Time Features Testing Guide

## Quick Start Testing

### Step 1: Start the Servers

```bash
# Terminal 1: Backend API
cd backend
uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Step 2: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Step 3: Login as Teacher

```
Email: teacher@lab.com
Password: teacher123
```

---

## 🎯 Test Scenarios

### Scenario 1: View Real-Time Student Data

**What to Test:**
1. Navigate to "Students" in the sidebar
2. Observe the Students Directory page

**Expected Results:**
✅ See 6 students with different programs (not all "Data Structures")
✅ Different progress percentages and colors
✅ Various status indicators (Coding/Active/Idle)
✅ Streak indicators (🔥 X days) for active students
✅ Time since last activity ("2h ago", "Just now", etc.)
✅ Animated pulsing dots for students currently coding
✅ Violation alerts for students with integrity issues

**Sample Data You Should See:**
- **Priya Nair**: Working on "Fibonacci Series" or "Linear Search" - 90%+ score
- **Ananya Singh**: High performer with 15-day streak
- **Rohan Mehta**: May have violations or lower progress

---

### Scenario 2: Real-Time Activity Simulation

**Steps:**
1. Keep Teacher Dashboard open in browser
2. Open a new terminal in backend directory
3. Run the activity simulator:

```bash
cd backend
python simulate_activity.py
```

4. Choose option **1** (Auto simulation)

**What Happens:**
1. Script selects a random student
2. Creates an "in-progress" session
3. Updates the session through multiple stages
4. May add violations (50% chance)
5. Completes the session with a quiz score

**Watch the Teacher Dashboard:**
- Student's status should change to "🟢 Coding" (green pulsing dot)
- "Last activity" should update to "Just now"
- If violation occurs, see ⚠️ warning icon
- When complete, status changes to "Active" (blue)
- Progress bar should update
- **No page refresh needed!**

---

### Scenario 3: Sidebar Details Panel

**Steps:**
1. Click on any student row in the directory
2. Observe the sidebar panel on the right

**Expected Results:**
✅ Student avatar with first letter
✅ Real-time status badge (Coding/Active/Idle/Flagged)
✅ Pulsing dot if currently coding
✅ Current streak counter
✅ Average score percentage
✅ Current program details with progress bar
✅ "Last activity" timestamp
✅ Latest session metrics (quiz score, hints used)
✅ Violation alerts (if any)
✅ Earned badges list

---

### Scenario 4: Multiple Students Coding Simultaneously

**Steps:**
1. Open Teacher Dashboard
2. Run the simulator multiple times in quick succession:

```bash
# Terminal 3
python simulate_activity.py
# Select option 1, wait for it to finish

# Run again
python simulate_activity.py
# Select option 1 again
```

**Expected Results:**
✅ Multiple students showing "Coding" status
✅ Each with their own program
✅ All pulsing indicators working
✅ Dashboard updates for each student without refresh

---

### Scenario 5: Violation Monitoring

**Steps:**
1. Use interactive mode of the simulator:

```bash
python simulate_activity.py
# Choose option 2 (Interactive mode)
```

2. Create an in-progress session (option 2)
3. Add a violation (option 3)
4. Watch the dashboard update

**Expected Results:**
✅ Red warning triangle appears next to student
✅ "X violations" text in red
✅ If 2+ violations, "FLAGGED" badge appears
✅ Sidebar shows detailed violation information

---

### Scenario 6: Progress Bar Color Changes

**What to Test:**
Look at different students' progress bars

**Expected Color Coding:**
- 🟢 **Green** (80-100%): Excellent performance
- 🟡 **Yellow** (60-79%): Good progress
- 🟠 **Orange** (40-59%): Needs improvement
- 🔴 **Red** (0-39%): Struggling

---

### Scenario 7: Manual Refresh

**Steps:**
1. Click the "Refresh" button in the top-right
2. Watch the loading animation

**Expected Results:**
✅ Button shows spinning icon
✅ "Updated: [time]" timestamp changes
✅ All data synchronizes
✅ Animation completes in ~1 second

---

### Scenario 8: Diverse Programs Display

**What to Verify:**
Students should be working on different programs:
- Fibonacci Series
- Linear Search
- Factorial using Recursion
- Bubble Sort
- Prime Number Check

**NOT just "Data Structures" for everyone!**

---

## 📊 Data Verification Checklist

### Student Row Data
- [ ] Roll number (CS001, CS002, etc.)
- [ ] Student name with avatar
- [ ] Streak indicator (🔥 X days) if applicable
- [ ] Actual program title (not generic)
- [ ] Time since last activity
- [ ] Progress bar with correct color
- [ ] Module completion (X/10)
- [ ] Percentage display
- [ ] Rank with appropriate icon
- [ ] Status badge with emoji
- [ ] Violation warnings (if applicable)
- [ ] Pulsing dot for active coding

### Sidebar Panel Data
- [ ] Student avatar (colored gradient)
- [ ] Real-time status badge
- [ ] Streak counter
- [ ] Average score
- [ ] Current program name
- [ ] Progress bar
- [ ] Last activity time
- [ ] Latest quiz score
- [ ] Hints used count
- [ ] Violation details (if any)
- [ ] Badges list

---

## 🐛 Troubleshooting

### Issue: No Real-Time Updates

**Check:**
1. Is backend running? (http://localhost:8000/api/health)
2. Is frontend running? (http://localhost:5173)
3. Check browser console for errors
4. Verify Firebase connection (should see WebSocket in Network tab)
5. Check Firestore rules allow teacher to read students/sessions

**Solution:**
```bash
# Restart both servers
# Backend
cd backend
uvicorn main:app --reload

# Frontend  
cd frontend
npm run dev
```

---

### Issue: All Students Show "Data Structures"

**This means:** Real-time listeners aren't active or no session data

**Solution:**
1. Run the enhanced seed script:
```bash
cd backend
python seed_enhanced.py
```

2. Run activity simulator:
```bash
python simulate_activity.py
```

3. Refresh the page

---

### Issue: Pulsing Dot Not Animated

**Check:**
1. Is student status actually "coding"?
2. Look for status badge text
3. Check browser supports CSS animations

**Verify:**
- Green dot should pulse when status = "coding"
- Blue dot (no pulse) when status = "active"
- Gray dot when status = "inactive"

---

### Issue: Sidebar Shows Wrong Data

**Check:**
1. Click on a different student
2. Close and reopen sidebar
3. Verify student has recent session data

---

## 📱 Browser Compatibility

### Recommended:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Features Tested:
- ✅ Real-time WebSocket connections
- ✅ CSS animations (pulsing dots)
- ✅ Smooth transitions
- ✅ Auto-scroll in tables
- ✅ Responsive sidebar

---

## 🎬 Demo Script (5 minutes)

Perfect for showcasing the system:

**Minute 1-2: Initial View**
- Open Teacher Dashboard → Students
- Point out different programs
- Show status indicators
- Highlight progress bars with colors

**Minute 3-4: Live Simulation**
- Run `python simulate_activity.py` (option 1)
- Watch status change from Idle → Coding (green pulse)
- Point out "Just now" timestamp
- Show completion (Coding → Active)

**Minute 5: Detailed View**
- Click on the simulated student
- Show sidebar with all details
- Highlight real-time status badge
- Point out violation monitoring (if any)

---

## 📈 Performance Testing

### Load Testing

```bash
# Simulate 10 concurrent activities
for i in {1..10}; do
  python simulate_activity.py &
done
```

**Expected:**
- Dashboard should handle 10+ students coding simultaneously
- No lag in UI updates
- Smooth animations
- Stable WebSocket connections

---

## 🔒 Security Testing

### What to Verify:
1. Students cannot see other students' data
2. Teachers see all students in their class
3. Firebase auth working correctly
4. Sessions tied to authenticated users
5. Violation data is read-only for students

---

## ✅ Final Checklist

Before considering testing complete:

- [ ] All 6 students visible with unique data
- [ ] Different programs displayed (not all "Data Structures")
- [ ] Status indicators working (Coding/Active/Idle)
- [ ] Pulsing animation for active coding
- [ ] Progress bars color-coded correctly
- [ ] Sidebar updates when clicking students
- [ ] Real-time simulation creates visible updates
- [ ] Violations display with alerts
- [ ] No page refresh needed for updates
- [ ] Manual refresh button works
- [ ] Timestamps show relative time ("2h ago")
- [ ] Streaks display for active students
- [ ] Rankings update dynamically

---

## 📞 Need Help?

If you encounter issues:

1. **Check Logs:**
   - Backend terminal for API errors
   - Frontend terminal for build errors
   - Browser console for JS errors

2. **Verify Data:**
   - Firebase Console → Firestore
   - Check `users`, `programs`, `sessions` collections

3. **Reset Data:**
   ```bash
   cd backend
   python seed_enhanced.py  # Repopulate database
   ```

4. **Test API Directly:**
   ```bash
   # Health check
   curl http://localhost:8000/api/health
   
   # Recent sessions
   curl http://localhost:8000/api/reports/sessions/recent
   ```

---

## 🎉 Success Criteria

Your implementation is successful when:

✅ Students show diverse programming activities
✅ Real-time updates work without page refresh
✅ Animated indicators show live coding sessions
✅ Violation monitoring is visible and accurate
✅ Progress bars update with appropriate colors
✅ Sidebar shows comprehensive student details
✅ Timestamps update relative to current time
✅ Manual simulation creates visible changes
✅ No console errors or warnings
✅ System handles multiple concurrent activities

**Congratulations! Your real-time student directory is fully functional! 🚀**