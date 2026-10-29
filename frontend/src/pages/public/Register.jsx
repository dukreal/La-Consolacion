import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthCard from '../../components/common/AuthCard'
import Notice from '../../components/common/Notice'
import { api } from '../../services/api'

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  confirm_password: '',
}

// Same checks (and order) as the old validateForm() script.
function validate(form) {
  if (form.first_name.trim() === '') return 'First name is required.'
  if (form.last_name.trim() === '') return 'Last name is required.'
  if (!form.email.endsWith('@gmail.com')) return 'Only Gmail accounts are allowed.'
  if (form.password !== form.confirm_password) return 'Passwords do not match.'
  if (form.password.length < 6) return 'Password must be at least 6 characters.'
  return ''
}

export default function Register() {
  const [form, setForm] = useState(emptyForm)
  const [clientError, setClientError] = useState('')
  const [serverErrors, setServerErrors] = useState([])
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess('')
    setServerErrors([])

    const problem = validate(form)
    setClientError(problem)
    if (problem) return

    setSubmitting(true)
    try {
      const data = await api('/auth/registration.php', { method: 'POST', body: form })
      if (data.success) {
        setSuccess(data.message)
      } else {
        setServerErrors(data.errors || ['Registration failed. Please try again.'])
      }
      // Keep the typed name and email, clear the passwords (like the old page did)
      setForm({ ...form, password: '', confirm_password: '' })
    } catch {
      setServerErrors(['Could not reach the server. Please try again.'])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard title="Register" subtitle="Create your account to start your jewelry journey.">
      {success && <Notice type="success">{success}</Notice>}
      {serverErrors.length > 0 && (
        <Notice type="error">
          {serverErrors.map((msg) => (
            <div key={msg}>{msg}</div>
          ))}
        </Notice>
      )}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input type="text" name="first_name" placeholder="First Name" required value={form.first_name} onChange={handleChange} />
        </div>
        <div className="input-group">
          <input type="text" name="last_name" placeholder="Last Name" required value={form.last_name} onChange={handleChange} />
        </div>
        <div className="input-group">
          <input
            type="email"
            name="email"
            placeholder="Gmail only"
            required
            pattern="^[a-zA-Z0-9._%+-]+@gmail\.com$"
            title="Gmail only"
            value={form.email}
            onChange={handleChange}
          />
        </div>
        <div className="input-group">
          <input type="password" name="password" placeholder="Password" required minLength={6} value={form.password} onChange={handleChange} />
        </div>
        <div className="input-group">
          <input type="password" name="confirm_password" placeholder="Confirm Password" required minLength={6} value={form.confirm_password} onChange={handleChange} />
        </div>
        <button type="submit" disabled={submitting}>Register</button>
        <div className="form-divider"><span>or</span></div>
        <p>
          Already have an account? <Link to="/login">Login here</Link>.
        </p>
      </form>
      <div id="error-message" style={{ color: 'red' }}>{clientError}</div>
    </AuthCard>
  )
}
