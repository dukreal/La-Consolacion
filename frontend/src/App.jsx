import { Route, Routes } from 'react-router-dom'
import AdminLayout from './components/admin/AdminLayout'
import AdminRoute from './components/admin/AdminRoute'
import ComingSoon from './components/common/ComingSoon'
import ProtectedRoute from './components/common/ProtectedRoute'
import PublicLayout from './components/layout/PublicLayout'
import AddCustomOrder from './pages/admin/AddCustomOrder'
import AddProduct from './pages/admin/AddProduct'
import EditCustomOrder from './pages/admin/EditCustomOrder'
import EditProduct from './pages/admin/EditProduct'
import Inventory from './pages/admin/Inventory'
import Logs from './pages/admin/Logs'
import Overview from './pages/admin/Overview'
import Users from './pages/admin/Users'
import WalkIn from './pages/admin/WalkIn'
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
          <Route path="/admin/orders" element={<ComingSoon title="Orders" />} />
          <Route path="/admin/walk-in" element={<WalkIn />} />
          <Route path="/admin/inventory" element={<Inventory />} />
          <Route path="/admin/inventory/add" element={<AddProduct />} />
          <Route path="/admin/inventory/edit/:id" element={<EditProduct />} />
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
