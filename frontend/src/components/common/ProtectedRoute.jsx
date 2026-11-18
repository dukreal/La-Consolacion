import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

// Puts pages behind login, like the old "if (!isset($_SESSION['user_id'])) redirect" check.
// Use it as a parent route: <Route element={<ProtectedRoute />}> ...pages... </Route>
// The page the guest wanted is remembered, so Login can send them back to it.
export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null // still asking PHP who is logged in
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />

  return <Outlet />
}
