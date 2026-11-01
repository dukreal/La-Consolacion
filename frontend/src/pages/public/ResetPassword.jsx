import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AuthCard from '../../components/common/AuthCard'
import Notice from '../../components/common/Notice'
import { api } from '../../services/api'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const data = await api('/auth/reset-password.php', {
        method: 'POST',
        body: { token, new_password: newPassword, confirm_password: confirmPassword },
      })
      if (data.success) setSuccess(true)
      else setError(data.message)
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard title="Reset Password" subtitle="Enter your new password below.">
      {success && (
        <Notice type="success">
          Password reset successful! You can now <Link to="/login">login</Link>.
        </Notice>
      )}
      {error && <Notice type="error">{error}</Notice>}

      {!success && (
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="password"
              name="new_password"
              placeholder="New Password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              name="confirm_password"
              placeholder="Confirm Password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={submitting}>Reset Password</button>
        </form>
      )}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link to="/login">Back to Login</Link>
      </div>
    </AuthCard>
  )
}
