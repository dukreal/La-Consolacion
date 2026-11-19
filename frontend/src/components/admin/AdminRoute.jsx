import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

// Puts the admin pages behind an admin login (like the old admin-check.php).
// Guests and customers are sent to the login page with the same messages as before.
export default function AdminRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null // still asking PHP who is logged in
  if (!user) {
    return <Navigate to="/login?error=login" replace state={{ from: location.pathname + location.search }} />
  }
  if (user.role !== 'admin') return <Navigate to="/login?error=admin" replace />

  return <Outlet />
}
