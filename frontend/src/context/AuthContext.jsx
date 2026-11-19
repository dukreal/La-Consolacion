import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'
import { AuthContext } from './auth-context'

// Asks PHP who is logged in. Returns the user, or null for a guest.
async function fetchUser() {
  try {
    const data = await api('/auth/me.php')
    return data.loggedIn ? data.user : null
  } catch {
    return null
  }
}

// Replaces $_SESSION for the React app: wraps the whole app and keeps the current user.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // null = guest
  const [loading, setLoading] = useState(true)

  // Check the session once when the app loads
  useEffect(() => {
    let cancelled = false
    fetchUser().then((u) => {
      if (!cancelled) {
        setUser(u)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Call this after login to load the new user
  const refresh = useCallback(async () => {
    setUser(await fetchUser())
  }, [])

  const logout = async () => {
    await api('/auth/logout.php', { method: 'POST' })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
