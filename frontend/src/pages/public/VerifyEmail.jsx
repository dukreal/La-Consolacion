import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AuthCard from '../../components/common/AuthCard'
import Notice from '../../components/common/Notice'
import { api } from '../../services/api'

// The page the link in the verification email opens. Same card as Login, Forgot and Reset Password.
export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''

  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('')

  // A token works only once, and React's dev mode runs effects twice,
  // so this flag makes sure we call the server a single time.
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    api(`/auth/verify-email.php?token=${encodeURIComponent(token)}`)
      .then((data) => {
        setStatus(data.success ? 'success' : 'error')
        setMessage(data.message)
      })
      .catch(() => {
        setStatus('error')
        setMessage('Could not reach the server. Please try again.')
      })
  }, [token])

  if (status === 'loading') {
    return (
      <AuthCard title="Verifying your email">
        <p className="form-status" role="status">
          Verifying your account...
        </p>
      </AuthCard>
    )
  }

  if (status === 'success') {
    return (
      <AuthCard title="Email verified">
        <Notice type="success">Your account has been verified! You may now log in.</Notice>
        <Link to="/login" className="auth-button-link">
          Go to Login
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Verification failed">
      <Notice type="error">{message}</Notice>
      <Link to="/login" className="auth-button-link">
        Back to Login
      </Link>
    </AuthCard>
  )
}
