import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../services/api'
import '../../styles/auth.css'

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

  return (
    <div className="verify-page">
      <div className="verify-container">
        {status === 'loading' && <div>Verifying your account...</div>}

        {status === 'success' && (
          <div className="verify-success">
            Your account has been verified! You may now <Link to="/login">log in</Link>.
          </div>
        )}

        {status === 'error' && (
          <>
            <div className="verify-error">{message}</div>
            <div style={{ marginTop: '1rem' }}>
              <Link to="/login">Back to Login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
