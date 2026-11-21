import { lazy } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import AdminLayout from './components/admin/AdminLayout'
import AdminRoute from './components/admin/AdminRoute'
import ProtectedRoute from './components/common/ProtectedRoute'
import PublicLayout from './components/layout/PublicLayout'
import Checkout from './pages/customer/Checkout'
import CustomOrderPayment from './pages/customer/CustomOrderPayment'
import PaymentSuccess from './pages/customer/PaymentSuccess'
import Profile from './pages/customer/Profile'
import Shop from './pages/customer/Shop'
import CustomOrderPreview from './pages/public/CustomOrderPreview'
import ForgotPassword from './pages/public/ForgotPassword'
import Home from './pages/public/Home'
import Login from './pages/public/Login'
import Register from './pages/public/Register'
import ResetPassword from './pages/public/ResetPassword'
import VerifyEmail from './pages/public/VerifyEmail'

// The admin pages are one separate download (pages/admin/index.js), fetched the first time an admin page opens.
// While it downloads, AdminLayout shows grey placeholders in the content area.
const loadAdmin = () => import('./pages/admin')
const adminPage = (name) => lazy(() => loadAdmin().then((pages) => ({ default: pages[name] })))
const AddCustomOrder = adminPage('AddCustomOrder')
const AddProduct = adminPage('AddProduct')
const EditCustomOrder = adminPage('EditCustomOrder')
const EditProduct = adminPage('EditProduct')
const Inventory = adminPage('Inventory')
const Logs = adminPage('Logs')
const Orders = adminPage('Orders')
const Overview = adminPage('Overview')
const Users = adminPage('Users')
const WalkIn = adminPage('WalkIn')

// /admin/inventory/edit/5 (the old address) -> /admin/inventory/edit-premade/5
function OldEditPremadeRedirect() {
  const { id } = useParams()
  return <Navigate to={`/admin/inventory/edit-premade/${id}`} replace />
}

export default function App() {
  return (
    <Routes>
      {/* Auth pages: full-screen card, no site header (same as the original pages) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Full pages without the site header, behind login (same as the old checkout and profile pages) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/custom-order/:id/payment" element={<CustomOrderPayment />} />
      </Route>
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/custom-order/:id" element={<CustomOrderPreview />} />

      {/* Admin pages: admin top bar and sidebar, admins only */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Overview />} />
          <Route path="/admin/orders" element={<Orders />} />
          <Route path="/admin/walk-in" element={<WalkIn />} />
          <Route path="/admin/inventory" element={<Inventory />} />
          <Route path="/admin/inventory/add-premade" element={<AddProduct />} />
          <Route path="/admin/inventory/edit-premade/:id" element={<EditProduct />} />
          {/* The old addresses still work */}
          <Route path="/admin/inventory/add" element={<Navigate to="/admin/inventory/add-premade" replace />} />
          <Route path="/admin/inventory/edit/:id" element={<OldEditPremadeRedirect />} />
          <Route path="/admin/inventory/add-custom" element={<AddCustomOrder />} />
          <Route path="/admin/inventory/edit-custom/:id" element={<EditCustomOrder />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/logs" element={<Logs />} />
        </Route>
      </Route>

      {/* Pages that show the shared header */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />

        {/* Pages that need a logged-in user (guests are sent to /login) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/shop" element={<Shop />} />
        </Route>

      </Route>
    </Routes>
  )
}
