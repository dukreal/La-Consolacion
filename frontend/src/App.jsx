import { Route, Routes } from 'react-router-dom'
import ComingSoon from './components/common/ComingSoon'
import PublicLayout from './components/layout/PublicLayout'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<ComingSoon title="Home" />} />
        <Route path="/shop" element={<ComingSoon title="Shop" />} />
        <Route path="/login" element={<ComingSoon title="Login" />} />
        <Route path="/register" element={<ComingSoon title="Register" />} />
        <Route path="/profile" element={<ComingSoon title="Profile" />} />
        <Route path="/admin" element={<ComingSoon title="Admin Dashboard" />} />
      </Route>
    </Routes>
  )
}