import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import SiteDialog from '../common/SiteDialog'

// Remembered for this visit only (this browser tab): once closed, it stays closed until the site is opened again
const SEEN_KEY = 'lcjWelcomeSeen'
const alreadySeen = () => {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}
const markSeen = () => {
  try {
    sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Storage blocked (private mode): the pop-up just shows again next time
  }
}

// Welcome pop-up shown to guests on the Home page, once per visit.
export default function LoginNotifyModal() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [closed, setClosed] = useState(alreadySeen)

  // Wait until we know whether someone is logged in, so members never see a flash of the popup.
  if (loading || user || closed) return null

  const close = () => {
    markSeen()
    setClosed(true)
  }

  return (
    <SiteDialog
      variant="info"
      icon="bx-diamond"
      showClose
      title="Welcome to La Consolacion Jewelry"
      message="Log in to shop, track your orders and pay for custom pieces. New here? Create a free account."
      cancelLabel="Create account"
      onCancel={() => navigate('/register')}
      confirmLabel="Log in"
      onConfirm={() => navigate('/login')}
      onClose={close}
    />
  )
}
