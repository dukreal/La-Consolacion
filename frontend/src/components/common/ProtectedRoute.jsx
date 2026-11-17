import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

// Puts pages behind login, like the old "if (!isset($_SESSION['user_id'])) redirect" check.
// Use it as a parent route: <Route element={<ProtectedRoute />}> ...pages... </Route>
export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return null // still asking PHP who is logged in
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
