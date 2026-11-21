import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AuthCard from '../../components/common/AuthCard'
import Notice from '../../components/common/Notice'
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
  const location = useLocation()
  const { refresh } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // The account exists but its email is not verified yet: offer to send the link again
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resend, setResend] = useState({ status: 'idle', message: '' }) // 'idle' | 'sending' | 'sent' | 'error'

  const from = location.state?.from
  // Opened the payment link from a custom order email without being logged in
  const forCustomOrder = /^\/custom-order\/\d+\/payment/.test(from || '')

  const code = params.get('error')
  const redirectError = code ? redirectMessages[code] || 'An error occurred. Please try again.' : ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setNeedsVerification(false)
    setResend({ status: 'idle', message: '' })
    setSubmitting(true)
    try {
      const data = await api('/auth/login.php', { method: 'POST', body: { email, password } })
      if (data.success) {
        await refresh() // load the logged-in user into AuthContext
        // Back to the page that asked for a login (for example a custom order link), otherwise
        // the admin dashboard or Home like before
        navigate(from || (data.role === 'admin' ? '/admin' : '/'), { replace: Boolean(from) })
      } else {
        setError(data.error)
        setNeedsVerification(Boolean(data.needsVerification))
      }
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Sends the verification email again (needs the same email and password as the login)
  const resendEmail = async () => {
    setResend({ status: 'sending', message: '' })
    try {
      const data = await api('/auth/resend-verification.php', { method: 'POST', body: { email, password } })
      setResend({ status: data.success ? 'sent' : 'error', message: data.message || data.error })
    } catch {
      setResend({ status: 'error', message: 'Could not reach the server. Please try again.' })
    }
  }

  const message = error || redirectError

  return (
    <AuthCard title="Login" subtitle="Welcome back! Please login to your account.">
      {forCustomOrder && (
        <Notice type="info">
          <strong>Log in to pay for your custom order.</strong> No account yet? Register with the email address your
          order was sent to.
        </Notice>
      )}
      {/* Every message shows at the top of the card (like Register) */}
      {message && resend.status !== 'sent' && (
        <Notice type="error">
          <div role="alert">{message}</div>
          {needsVerification && resend.status !== 'sent' && (
            <button type="button" className="notice-action" onClick={resendEmail} disabled={resend.status === 'sending'}>
              {resend.status === 'sending' ? 'Sending...' : 'Resend verification email'}
            </button>
          )}
        </Notice>
      )}
      {resend.status === 'sent' && <Notice type="success">{resend.message}</Notice>}
      {resend.status === 'error' && <Notice type="error">{resend.message}</Notice>}

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
        <div className="form-aside">
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>
        <button type="submit" disabled={submitting}>Login</button>
        <div className="form-divider"><span>or</span></div>
        <p>
          Don&apos;t have an account? <Link to="/register" state={from ? { from } : undefined}>Register here</Link>.
        </p>
      </form>
    </AuthCard>
  )
}
