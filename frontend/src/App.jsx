// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './services/firebase'
import { ThemeProvider } from './contexts/ThemeContext'

import Landing from './pages/Landing'
import Signup from './pages/Signup'
import Login from './pages/Login'
import StudentLayout from './layouts/StudentLayout'
import TeacherLayout from './layouts/TeacherLayout'
import StudentDashboard from './pages/student/StudentDashboard'
import ProgramLibrary from './pages/student/ProgramLibrary'
import Profile from './pages/student/Profile'
import Sessions from './pages/student/Sessions'
import Session from './pages/student/Session'
import Quiz from './pages/student/Quiz'
import UnderstandLogic from './pages/student/UnderstandLogic'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherProfile from './pages/teacher/Profile'
import StudentReport from './pages/teacher/StudentReport'
import ClassAnalytics from './pages/teacher/ClassAnalytics'
import UploadProgram from './pages/teacher/UploadProgram'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)   // 'student' | 'teacher'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Firebase listener — fires whenever auth state changes
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // Fetch role from Firestore users collection
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDoc.exists()) {
          setRole(userDoc.data().role)
        }
      } else {
        setUser(null)
        setRole(null)
      }
      setLoading(false)
    })
    return () => unsub()  // cleanup listener on unmount
  }, [])

  // Show nothing while checking auth (prevents flash)
  if (loading) return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='text-blue-600 text-lg font-medium'>Loading...</div>
    </div>
  )

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
        {/* Public routes */}
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />

        {/* Student routes - wrapped in StudentLayout */}
        <Route path='/student' element={
          <ProtectedRoute user={user} role={role} requiredRole='student'>
            <StudentLayout user={user} />
          </ProtectedRoute>
        }>
          <Route path='dashboard' element={<StudentDashboard user={user} />} />
          <Route path='programs' element={<ProgramLibrary />} />
          <Route path='sessions' element={<Sessions user={user} />} />
          <Route path='profile' element={<Profile user={user} />} />
        </Route>

        {/* Student session routes - outside layout for fullscreen */}
        <Route path='/student/understand/:programId' element={
          <ProtectedRoute user={user} role={role} requiredRole='student'>
            <UnderstandLogic />
          </ProtectedRoute>
        } />
        <Route path='/student/session/:programId' element={
          <ProtectedRoute user={user} role={role} requiredRole='student'>
            <Session />
          </ProtectedRoute>
        } />
        <Route path='/student/quiz' element={
          <ProtectedRoute user={user} role={role} requiredRole='student'>
            <Quiz />
          </ProtectedRoute>
        } />

        {/* Teacher routes - wrapped in TeacherLayout */}
        <Route path='/teacher' element={
          <ProtectedRoute user={user} role={role} requiredRole='teacher'>
            <TeacherLayout user={user} />
          </ProtectedRoute>
        }>
          <Route path='dashboard' element={<TeacherDashboard user={user} />} />
          <Route path='programs' element={<UploadProgram />} />
          <Route path='analytics' element={<ClassAnalytics />} />
          <Route path='profile' element={<TeacherProfile user={user} />} />
        </Route>

        {/* Teacher report route - outside layout for fullscreen */}
        <Route path='/teacher/report/:sessionId' element={
          <ProtectedRoute user={user} role={role} requiredRole='teacher'>
            <StudentReport />
          </ProtectedRoute>
        } />

        {/* Default redirect based on role */}
        <Route path='/' element={
          user
            ? role === 'teacher'
              ? <Navigate to='/teacher/dashboard' replace />
              : <Navigate to='/student/dashboard' replace />
            : <Landing />
        } />

        {/* Catch-all */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  )
}