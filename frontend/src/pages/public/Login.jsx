import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthCard from '../../components/common/AuthCard'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'

// Messages shown when a protected page sends someone back to /login?error=...
const redirectMessages = {
  admin: 'Only authorized personnel are allowed.',
  login: 'Please login to access this page.',
  role_changed: 'Your role has been changed. Please login again.',
  user_not_found: 'User account not found or has been deleted.',
  system_error: 'System error. Please try again.',
}

export default function Login() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { refresh } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const code = params.get('error')
  const redirectError = code ? redirectMessages[code] || 'An error occurred. Please try again.' : ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const data = await api('/auth/login.php', { method: 'POST', body: { email, password } })
      if (data.success) {
        await refresh() // load the logged-in user into AuthContext
        navigate(data.role === 'admin' ? '/admin' : '/')
      } else {
        setError(data.error)
      }
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const message = error || redirectError

  return (
    <AuthCard title="Login" subtitle="Welcome back! Please login to your account.">
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="input-group">
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div style={{ textAlign: 'right', marginBottom: '10px' }}>
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>
        <button type="submit" disabled={submitting}>Login</button>
        <div className="form-divider"><span>or</span></div>
        <p>
          Don&apos;t have an account? <Link to="/register">Register here</Link>.
        </p>
      </form>
      {message && (
        <div id="error-message" style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>
          {message}
        </div>
      )}
    </AuthCard>
  )
}
