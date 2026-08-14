import { Navigate } from 'react-router-dom'

// Wraps any route that requires login + correct role
// If user is not logged in → redirect to /login
// If user is wrong role (student visiting teacher route) → redirect to their dashboard
export default function ProtectedRoute({ user, role, requiredRole, children }) {
  if (!user) {
    return <Navigate to='/login' replace />
  }
  if (role && role !== requiredRole) {
    const redirect = role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'
    return <Navigate to={redirect} replace />
  }
  return children
}