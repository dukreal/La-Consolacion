import { useContext } from 'react'
import { AuthContext } from '../context/auth-context'

// Use in any component: const { user, logout } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}
