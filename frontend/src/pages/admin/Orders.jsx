import { CheckCircle, Clock, Gem, Package, PlusCircle, Settings, ShoppingBag, ShoppingCart, User, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import IconModal, { OkButton } from '../../components/admin/IconModal'
import OrderDetailsModal from '../../components/admin/OrderDetailsModal'
import PaymentModal from '../../components/admin/PaymentModal'
import { deleteOrder, getOrders } from '../../services/adminService'

// Colors of the status pill in the table (same as the old $statusMap)
const STATUS = {
  pending: { dot: 'bg-yellow-500', style: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Pending' },
  processing: { dot: 'bg-blue-500', style: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Processing' },
  waiting_for_buyer: { dot: 'bg-purple-500', style: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Waiting' },
  completed: { dot: 'bg-green-500', style: 'bg-green-50 text-green-700 border-green-200', label: 'Completed' },
  cancelled: { dot: 'bg-red-500', style: 'bg-red-50 text-red-700 border-red-200', label: 'Cancelled' },
}
const UNPAID = { dot: 'bg-orange-500', style: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Unpaid' }

const STAT_CARDS = [
  { key: 'total', label: 'Total Orders', icon: ShoppingCart, colors: 'from-violet-400 via-violet-500 to-violet-600' },
  { key: 'pending', label: 'Pending', icon: Clock, colors: 'from-amber-400 via-amber-500 to-amber-600' },
  { key: 'processing', label: 'Processing', icon: Settings, colors: 'from-sky-400 via-sky-500 to-sky-600' },
  { key: 'completed', label: 'Completed', icon: CheckCircle, colors: 'from-emerald-400 via-emerald-500 to-emerald-600' },
]

const formatDate = (value) =>
  new Date(value.replace(' ', 'T')).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })

function StatCard({ label, value, icon: Icon, colors, stat }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${colors} rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full translate-y-12 -translate-x-12" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="w-14 h-14 bg-white bg-opacity-30 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-lg">
            <Icon className="w-7 h-7 text-white drop-shadow-lg" />
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-white drop-shadow-lg" data-stat={stat}>{value}</div>
            <div className="text-white text-base font-semibold drop-shadow-md">{label}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductCell({ item }) {
  if (!item) {
    return (
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
          <Package className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">No Product</p>
          <p className="text-sm text-gray-500">No items found</p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center space-x-3">
      {item.image ? (
        <div className="w-12 h-12 rounded-lg overflow-hidden shadow-sm bg-gray-100">
          <img src={`/uploads/${item.folder}/${item.image}`} alt={item.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-violet-500 rounded-lg flex items-center justify-center shadow-sm">
          <Gem className="w-6 h-6 text-white" />
        </div>
      )}
      <div>
        <p className="font-semibold text-gray-900">{item.name}</p>
        <p className="text-sm text-gray-500">Jewelry Product</p>
      </div>
    </div>
  )
}

function CustomerCell({ order }) {
  let subtitle = <span className="text-gray-500">Customer</span>
  if (order.isWalkIn) subtitle = <span className="text-blue-600">Walk-In</span>
  else if (order.role === 'admin') subtitle = <span className="text-purple-600">Admin</span>

  return (
    <div className="flex items-center gap-4">
      {!order.isWalkIn && order.profileImage ? (
        <img src={`/uploads/profile/${order.profileImage}`} alt="Profile" className="w-10 h-10 rounded-full object-cover bg-gray-100" />
      ) : (
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${
            order.isWalkIn ? 'from-blue-600 to-indigo-600' : 'from-slate-400 to-slate-500'
          } text-white shadow-sm`}
        >
          {order.isWalkIn ? <ShoppingBag className="w-5 h-5" /> : <User className="w-5 h-5" />}
        </div>
      )}
      <div>
        <div className="font-bold text-gray-900 leading-tight">{order.isWalkIn ? 'Walk-In Sale' : order.username}</div>
        <div className="text-xs font-semibold uppercase tracking-wider">{subtitle}</div>
      </div>
    </div>
  )
}

function StatusPill({ order }) {
  const s = order.paid ? STATUS[order.status] || STATUS.pending : UNPAID
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${s.style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

// "Sale Recorded!" in the bottom-right corner after a walk-in sale. Slides in, leaves after 4 seconds.
function WalkInToast({ onClose }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const show = setTimeout(() => setShown(true), 100)
    const hide = setTimeout(() => setShown(false), 4000)
    const remove = setTimeout(onClose, 4500)
    return () => [show, hide, remove].forEach(clearTimeout)
  }, [onClose])

  return (
    <div
      id="walkinToast"
      className={`fixed bottom-6 right-6 z-[9999] transform transition-all duration-500 ease-out ${shown ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
    >
      <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-emerald-400/20 backdrop-blur-md">
        <div className="bg-white/20 p-2 rounded-lg">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="font-bold text-lg">Sale Recorded!</p>
          <p className="text-emerald-100 text-sm">Inventory has been updated successfully.</p>
        </div>
        <button type="button" onClick={() => { setShown(false); setTimeout(onClose, 500) }} className="ml-4 text-emerald-200 hover:text-white" title="Close">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default function Orders() {
  const location = useLocation()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [walkinToast, setWalkinToast] = useState(Boolean(location.state?.walkinSuccess))
  const [toDelete, setToDelete] = useState(null) // order id waiting for "Delete Order?" answer
  const [deleting, setDeleting] = useState(false)
  const [alert, setAlert] = useState(null) // { type, title, message }
  const [detailsId, setDetailsId] = useState(null) // order shown in the Details pop-up
  const [paymentId, setPaymentId] = useState(null) // payment shown in the Payment pop-up

  const load = useCallback(() => {
    return getOrders()
      .then((d) => { setData(d); setError('') })
      .catch((e) => setError(e.message))
  }, [])

  useEffect(() => { load() }, [load])

  // Forget the walk-in message so a refresh does not show it again (the old page cleaned the URL)
  useEffect(() => {
    if (location.state?.walkinSuccess) navigate(location.pathname, { replace: true, state: null })
  }, [location, navigate])

  const closeWalkinToast = useCallback(() => setWalkinToast(false), [])

  // A status changed in the Details pop-up: update that row and the stat cards without reloading
  const handleStatusChange = useCallback((id, status) => {
    setData((d) => ({ ...d, orders: d.orders.map((o) => (o.id === id ? { ...o, status } : o)) }))
  }, [])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await deleteOrder(toDelete)
      if (res.success) {
        setAlert({ type: 'success', title: 'Order Deleted', message: 'Order has been successfully deleted.' })
        await load()
      } else {
        setAlert({ type: 'error', title: 'Delete Failed', message: res.message || res.error || 'Failed to delete order.' })
      }
    } catch {
      setAlert({ type: 'error', title: 'Delete Failed', message: 'Network error occurred while deleting order.' })
    }
    setDeleting(false)
    setToDelete(null)
  }

  const orders = data?.orders ?? []
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing' || o.status === 'waiting_for_buyer').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Order Management</h1>
          <p className="text-gray-600 text-lg">Manage and track all customer orders</p>
        </div>
        <div>
          <Link
            to="/admin/walk-in"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold shadow-lg hover:from-emerald-600 hover:to-blue-600 transition-all transform hover:-translate-y-1 text-lg"
          >
            <PlusCircle className="w-6 h-6" />
            Walk-in Order
          </Link>
        </div>
      </div>

      {walkinToast && <WalkInToast onClose={closeWalkinToast} />}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {STAT_CARDS.map((c) => (
          <StatCard key={c.key} stat={c.key === 'total' ? 'total-orders' : c.key} label={c.label} value={stats[c.key]} icon={c.icon} colors={c.colors} />
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-sky-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Order Details</h2>
          <p className="text-gray-600">Manage individual order status and details</p>
        </div>

        {data && orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No orders found</h3>
            <p className="text-gray-500">Orders will appear here when customers make purchases.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">PRODUCT NAME</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">CUSTOMER NAME</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">ORDER ID</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">AMOUNT</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">STATUS</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">ACTION</th>
                </tr>
              </thead>
              <tbody id="ordersTableBody" className="bg-white divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-all duration-200" data-order-id={order.id}>
                    <td className="px-6 py-4 w-64"><ProductCell item={order.firstItem} /></td>
                    <td className="px-6 py-4 w-40"><CustomerCell order={order} /></td>
                    <td className="px-6 py-4 w-32">
                      <p className="font-semibold text-gray-900">#{order.id}</p>
                      <p className="text-sm text-gray-500">{formatDate(order.dateOrdered)}</p>
                    </td>
                    <td className="px-6 py-4 w-32 text-right">
                      <p className="font-bold text-lg text-gray-900">
                        ₱{order.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                      {order.service && order.service !== 'custom' && (
                        <p className="text-xs text-gray-500 uppercase">{order.service}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 w-32 text-center status-cell"><StatusPill order={order} /></td>
                    <td className="px-6 py-4 w-32 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button type="button" onClick={() => setDetailsId(order.id)} className="view-order-details-btn bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200">
                          Details
                        </button>
                        {order.paid ? (
                          <button type="button" onClick={() => setPaymentId(order.paymentId)} className="view-payment-btn bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200">
                            Payment
                          </button>
                        ) : (
                          <button type="button" disabled title="Customer not yet paid" className="bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1 rounded-lg text-xs font-medium">
                            Unpaid
                          </button>
                        )}
                        {data.adminLevel === 2 && (
                          <button
                            type="button"
                            onClick={() => setToDelete(order.id)}
                            className="deleteOrderBtn bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailsId && (
        <OrderDetailsModal orderId={detailsId} onClose={() => setDetailsId(null)} onStatusChange={handleStatusChange} />
      )}

      {paymentId && <PaymentModal paymentId={paymentId} onClose={() => setPaymentId(null)} />}

      {toDelete && (
        <IconModal
          id="deleteOrderConfirmModal"
          type="delete"
          title="Delete Order?"
          message="Are you sure you want to delete this order? This action can be undone from the database but will hide the order from the admin panel."
        >
          <button
            type="button"
            id="deleteOrderConfirmYesBtn"
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            type="button"
            id="deleteOrderConfirmCancelBtn"
            onClick={() => setToDelete(null)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
          >
            Cancel
          </button>
        </IconModal>
      )}

      {alert && (
        <IconModal id="alertModal" type={alert.type} title={alert.title} message={alert.message}>
          <OkButton onClick={() => setAlert(null)} />
        </IconModal>
      )}
    </>
  )
}
