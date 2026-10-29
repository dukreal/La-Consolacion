import { Route, Routes } from 'react-router-dom'
import ComingSoon from './components/common/ComingSoon'
import PublicLayout from './components/layout/PublicLayout'
import ForgotPassword from './pages/public/ForgotPassword'
import Login from './pages/public/Login'
import Register from './pages/public/Register'
import ResetPassword from './pages/public/ResetPassword'
import VerifyEmail from './pages/public/VerifyEmail'

export default function App() {
  return (
    <Routes>
      {/* Auth pages: full-screen card, no site header (same as the original pages) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Pages that show the shared header */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<ComingSoon title="Home" />} />
        <Route path="/shop" element={<ComingSoon title="Shop" />} />
        <Route path="/profile" element={<ComingSoon title="Profile" />} />
        <Route path="/admin" element={<ComingSoon title="Admin Dashboard" />} />
      </Route>
    </Routes>
  )
}
