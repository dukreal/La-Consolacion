import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

// Popup shown to guests on the Home page (same text as the original).
export default function LoginNotifyModal() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [closed, setClosed] = useState(false)

  // Wait until we know whether someone is logged in, so members never see a flash of the popup.
  if (loading || user || closed) return null

  return (
    <div id="loginNotifyModal" className="login-notify-modal-overlay">
      <div className="login-notify-modal">
        <button className="login-notify-close" onClick={() => setClosed(true)}>&times;</button>
        <div className="login-notify-title">Welcome to La Consolacion Jewelry</div>
        <div className="login-notify-message">
          Please log in to access your account and enjoy a personalized shopping experience.
        </div>
        <button className="login-notify-login" onClick={() => navigate('/login')}>Login</button>
      </div>
    </div>
  )
}
