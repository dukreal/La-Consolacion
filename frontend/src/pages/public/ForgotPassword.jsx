import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthCard from '../../components/common/AuthCard'
import Notice from '../../components/common/Notice'
import { api } from '../../services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const data = await api('/auth/forgot-password.php', { method: 'POST', body: { email } })
      setMessage(data.message)
      setIsError(!data.success)
    } catch {
      setMessage('Could not reach the server. Please try again.')
      setIsError(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard title="Forgot Password" subtitle="Enter your email to receive a password reset link.">
      {message && <Notice type={isError ? 'error' : 'success'}>{message}</Notice>}
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" disabled={submitting}>Send Reset Link</button>
      </form>
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link to="/login">Back to Login</Link>
      </div>
    </AuthCard>
  )
}
