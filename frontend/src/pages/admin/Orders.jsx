import { CheckCircle, Clock, Gem, Hourglass, Package, PackageCheck, PlusCircle, Settings, ShoppingBag, ShoppingCart, Store, Trash2, TrendingUp, User, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import IconModal, { OkButton } from '../../components/admin/IconModal'
import OrderDetailsModal from '../../components/admin/OrderDetailsModal'
import PaymentModal from '../../components/admin/PaymentModal'
import Skeleton, { LoadingArea } from '../../components/admin/Skeleton'
import StatCard from '../../components/admin/StatCard'
import { useAuth } from '../../hooks/useAuth'
import { refreshingClass, useRefreshing } from '../../hooks/useRefreshing'
import { deleteOrder, getOrders } from '../../services/adminService'
import { cancelButton, dangerButton } from '../../utils/dialogButtons'
import { orderStatus } from '../../utils/orderStatus'

// note: the bottom line of each card, like on Overview (Processing also counts orders waiting for the buyer)
const STAT_CARDS = [
  { key: 'total', label: 'Total Orders', icon: ShoppingCart, colors: 'from-violet-400 via-violet-500 to-violet-600', noteIcon: TrendingUp },
  { key: 'pending', label: 'Pending', icon: Clock, colors: 'from-amber-400 via-amber-500 to-amber-600', note: 'Awaiting processing', noteIcon: Hourglass },
  { key: 'processing', label: 'Processing', icon: Settings, colors: 'from-sky-400 via-sky-500 to-sky-600', note: 'Incl. ready for pickup', noteIcon: Store },
  { key: 'completed', label: 'Completed', icon: CheckCircle, colors: 'from-emerald-400 via-emerald-500 to-emerald-600', note: 'Handed to buyer', noteIcon: PackageCheck },
]

const formatDate = (value) =>
  new Date(value.replace(' ', 'T')).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })

// The product picture (or a placeholder). Never squeezed.
function ProductThumb({ item, size = 'w-12 h-12' }) {
  if (!item) {
    return (
      <div className={`${size} flex-shrink-0 bg-gray-200 rounded-lg flex items-center justify-center`}>
        <Package className="w-6 h-6 text-gray-400" />
      </div>
    )
  }
  if (item.image) {
    return (
      <div className={`${size} flex-shrink-0 rounded-lg overflow-hidden shadow-sm bg-gray-100`}>
        <img src={`/uploads/${item.folder}/${item.image}`} alt={item.name} className="w-full h-full object-cover" />
      </div>
    )
  }
  return (
    <div className={`${size} flex-shrink-0 bg-gradient-to-br from-violet-400 to-violet-500 rounded-lg flex items-center justify-center shadow-sm`}>
      <Gem className="w-6 h-6 text-white" />
    </div>
  )
}

// Table: picture, name and "Jewelry Product"
function ProductCell({ item }) {
  return (
    <div className="flex items-center space-x-3">
      <ProductThumb item={item} />
      <div>
        <p className="font-semibold text-gray-900">{item ? item.name : 'No Product'}</p>
        <p className="text-sm text-gray-500">{item ? 'Jewelry Product' : 'No items found'}</p>
      </div>
    </div>
  )
}

// Who placed the order: Walk-In, Admin or Customer (with its color)
function customerKind(order) {
  if (order.isWalkIn) return { label: 'Walk-In', color: 'text-blue-600' }
  if (order.role === 'admin') return { label: 'Admin', color: 'text-purple-600' }
  return { label: 'Customer', color: 'text-gray-500' }
}

function CustomerAvatar({ order, size = 'w-10 h-10', iconSize = 'w-5 h-5' }) {
  if (!order.isWalkIn && order.profileImage) {
    return <img src={`/uploads/profile/${order.profileImage}`} alt="" className={`${size} flex-shrink-0 rounded-full object-cover bg-gray-100`} />
  }
  return (
    <div
      className={`${size} flex-shrink-0 rounded-full flex items-center justify-center bg-gradient-to-br ${
        order.isWalkIn ? 'from-blue-600 to-indigo-600' : 'from-slate-400 to-slate-500'
      } text-white shadow-sm`}
    >
      {order.isWalkIn ? <ShoppingBag className={iconSize} /> : <User className={iconSize} />}
    </div>
  )
}

// Table: avatar, name and Walk-In / Admin / Customer under it
function CustomerCell({ order }) {
  const kind = customerKind(order)
  return (
    <div className="flex items-center gap-4">
      <CustomerAvatar order={order} />
      <div>
        <div className="font-bold text-gray-900 leading-tight">{order.isWalkIn ? 'Walk-In Sale' : order.username}</div>
        <div className={`text-xs font-semibold uppercase tracking-wider ${kind.color}`}>{kind.label}</div>
      </div>
    </div>
  )
}

// Cards: one small line, "dukdakdok · Customer" (walk-ins just say "Walk-In Sale")
function CustomerLine({ order }) {
  const kind = customerKind(order)
  return (
    <div className="mt-1 flex items-center gap-1.5 min-w-0 text-sm text-gray-600">
      <CustomerAvatar order={order} size="w-5 h-5" iconSize="w-3 h-3" />
      {order.isWalkIn ? (
        <span className={`truncate font-medium ${kind.color}`}>Walk-In Sale</span>
      ) : (
        <span className="truncate">
          <span className="font-medium text-gray-800">{order.username}</span> · <span className={kind.color}>{kind.label}</span>
        </span>
      )}
    </div>
  )
}

function StatusPill({ order }) {
  // Colors and admin wording from utils/orderStatus.js ("Waiting" is short for Waiting for Buyer)
  const s = orderStatus(order.status, { admin: true, short: true, unpaid: !order.paid })
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

// Details / Payment (or Unpaid) / Delete. Used by the table and by the order cards.
// Cards: taller buttons (easier to tap), sharing the width on phones, and Delete as a separate trash icon.
// Delete gets the whole order: an active one has to be cancelled first (see askDelete).
function OrderActions({ order, adminLevel, onDetails, onPayment, onDelete, card = false, className = '' }) {
  const size = card ? 'h-9 px-4 text-sm flex-1 sm:flex-none' : 'px-3 py-1 text-xs'
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button type="button" onClick={() => onDetails(order.id)} className={`view-order-details-btn ${size} bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200`}>
        Details
      </button>
      {order.paid ? (
        <button type="button" onClick={() => onPayment(order.paymentId)} className={`view-payment-btn ${size} bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg font-medium transition-colors duration-200`}>
          Payment
        </button>
      ) : (
        <button type="button" disabled title="Customer not yet paid" className={`${size} bg-orange-50 text-orange-700 border border-orange-200 rounded-lg font-medium`}>
          Unpaid
        </button>
      )}
      {adminLevel === 2 &&
        (card ? (
          <button
            type="button"
            onClick={() => onDelete(order)}
            aria-label={`Delete order #${order.id}`}
            title="Delete"
            className="deleteOrderBtn w-9 h-9 flex-shrink-0 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onDelete(order)}
            className="deleteOrderBtn bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200"
          >
            Delete
          </button>
        ))}
    </div>
  )
}

// Placeholders shown until the orders arrive, shaped like the order cards and the table rows
const SKELETON_ROWS = [1, 2, 3, 4, 5]

function OrderCardSkeleton({ canDelete }) {
  return (
    <li className="p-4 sm:px-6 sm:py-5">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="mt-3 flex items-start gap-3">
        <Skeleton className="w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 !rounded-lg" />
        <div className="flex-1 min-w-0">
          <Skeleton className="mt-0.5 h-4 w-3/4 max-w-[14rem]" />
          <Skeleton className="mt-2.5 h-4 w-1/2 max-w-[10rem]" />
        </div>
        <Skeleton className="mt-0.5 h-5 w-16 flex-shrink-0" />
      </div>
      <div className="mt-3 flex items-center gap-2 sm:justify-end">
        <Skeleton className="h-9 flex-1 sm:flex-none sm:w-24 !rounded-lg" />
        <Skeleton className="h-9 flex-1 sm:flex-none sm:w-24 !rounded-lg" />
        {canDelete && <Skeleton className="h-9 w-9 flex-shrink-0 !rounded-lg" />}
      </div>
    </li>
  )
}

function OrderRowSkeleton({ canDelete }) {
  return (
    <tr>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 flex-shrink-0 !rounded-lg" />
          <div className="flex-1"><Skeleton className="h-4 w-40" /><Skeleton className="mt-2 h-3 w-24" /></div>
        </div>
      </td>
      <td className="px-6 py-4 w-40">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 flex-shrink-0 !rounded-full" />
          <div className="flex-1"><Skeleton className="h-4 w-[4.75rem]" /><Skeleton className="mt-2 h-3 w-14" /></div>
        </div>
      </td>
      <td className="px-6 py-4 w-32"><Skeleton className="h-4 w-10" /><Skeleton className="mt-2 h-3 w-[5.5rem]" /></td>
      <td className="px-6 py-4 w-32"><Skeleton className="ml-auto h-5 w-16" /></td>
      <td className="px-6 py-4 w-32"><Skeleton className="mx-auto h-6 w-[5.75rem]" /></td>
      {/* Same widths as the Details / Payment / Delete buttons, so the columns keep their place */}
      <td className="px-6 py-4 w-32">
        <div className="flex justify-center gap-2">
          <Skeleton className="h-6 w-[3.95rem] !rounded-lg" />
          <Skeleton className="h-6 w-[4.65rem] !rounded-lg" />
          {canDelete && <Skeleton className="h-6 w-[3.8rem] !rounded-lg" />}
        </div>
      </td>
    </tr>
  )
}

// The table's column headings (the loading placeholder table uses the same ones, so the columns do not shift)
function OrdersTableHead() {
  return (
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRODUCT NAME</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">CUSTOMER NAME</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-32">ORDER ID</th>
        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">AMOUNT</th>
        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">STATUS</th>
        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">ACTION</th>
      </tr>
    </thead>
  )
}

const peso = (n) => '₱' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })

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
      className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 lg:bottom-6 lg:right-6 z-[9999] transform transition-all duration-500 ease-out ${shown ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
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
  const { user: me } = useAuth()
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
  const [reloading, setReloading] = useState(false) // getting the list again after a delete
  const refreshing = useRefreshing(reloading)

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

  // Only finished or unpaid orders can be deleted (the server checks this too). Deleting a paid, active order
  // would only hide it: the customer would still see it as active and its stock would never come back.
  const askDelete = useCallback((order) => {
    if (!order.paid || order.status === 'completed' || order.status === 'cancelled') {
      setToDelete(order.id)
    } else {
      setAlert({
        type: 'warning',
        title: 'Cancel the order first',
        message: `Order #${order.id} is still active. Open Details and change its status to Cancelled: this puts the items back into stock and emails the customer. Then you can delete it.`,
      })
    }
  }, [])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await deleteOrder(toDelete)
      if (res.success) {
        setAlert({ type: 'success', title: 'Order Deleted', message: 'Order has been successfully deleted.' })
        setReloading(true)
        await load()
        setReloading(false)
      } else {
        setAlert({ type: 'error', title: 'Delete Failed', message: res.message || res.error || 'Failed to delete order.' })
      }
    } catch {
      setAlert({ type: 'error', title: 'Delete Failed', message: 'Network error occurred while deleting order.' })
    }
    setDeleting(false)
    setToDelete(null)
  }

  const loading = !data && !error
  const orders = data?.orders ?? []
  const canDelete = (data?.adminLevel ?? Number(me?.adminLevel)) === 2
  const actionHandlers = { onDetails: setDetailsId, onPayment: setPaymentId, onDelete: askDelete }
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing' || o.status === 'waiting_for_buyer').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  }

  return (
    <>
      {/* Header: title and the Walk-in button side by side (a shorter label on phones) */}
      <div className="mb-6 sm:mb-8 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[1.375rem] leading-tight sm:text-4xl font-bold text-gray-800 sm:mb-2">Order Management</h1>
          <p className="text-gray-600 text-sm sm:text-lg">Manage and track all customer orders</p>
        </div>
        <Link
          to="/admin/walk-in"
          className="flex-shrink-0 inline-flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-6 sm:py-3 rounded-xl bg-[#22306a] hover:bg-[#1a2550] text-white font-bold shadow-lg transition-colors duration-200 text-sm sm:text-lg"
        >
          <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="sm:hidden">Walk-in</span>
          <span className="hidden sm:inline">Walk-in Order</span>
        </Link>
      </div>

      {walkinToast && <WalkInToast onClose={closeWalkinToast} />}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Stats */}
      {/* While loading, the numbers are see-through placeholders (instead of showing 0) */}
      <div className={`stat-grid stat-grid-short grid grid-cols-2 gap-3 sm:gap-6 mb-8 ${refreshingClass(refreshing)}`}>
        {STAT_CARDS.map((c) => (
          <StatCard
            key={c.key}
            stat={c.key === 'total' ? 'total-orders' : c.key}
            label={c.label}
            value={loading ? <Skeleton tone="light" className="inline-block align-middle w-9 h-6 sm:w-12 sm:h-8" /> : stats[c.key]}
            icon={c.icon}
            gradient={c.colors}
            note={c.key === 'total' ? <>This week: {loading ? <Skeleton tone="light" className="inline-block align-middle w-5 h-3.5" /> : (data?.thisWeek ?? 0)}</> : c.note}
            noteIcon={c.noteIcon}
          />
        ))}
      </div>

      {/* Table */}
      <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${refreshingClass(refreshing)}`} aria-busy={refreshing || undefined}>
        <div className="bg-gradient-to-r from-slate-50 to-sky-50 px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800">Order Details</h2>
          <p className="text-sm sm:text-base text-gray-600">Manage individual order status and details</p>
        </div>

        {loading ? (
          <LoadingArea label="Loading orders…">
            <ul className="orders-cards divide-y divide-gray-100">
              {SKELETON_ROWS.map((n) => <OrderCardSkeleton key={n} canDelete={canDelete} />)}
            </ul>
            <div className="orders-table overflow-x-auto">
              <table className="w-full">
                <OrdersTableHead />
                <tbody className="bg-white divide-y divide-gray-100">
                  {SKELETON_ROWS.map((n) => <OrderRowSkeleton key={n} canDelete={canDelete} />)}
                </tbody>
              </table>
            </div>
          </LoadingArea>
        ) : data && orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No orders found</h3>
            <p className="text-gray-500">Orders will appear here when customers make purchases.</p>
          </div>
        ) : (
          <>
            {/* Narrower than 96em (1536px at normal text size, wider if the browser text is set larger):
                one card per order, so nothing has to squeeze into a narrow column */}
            <ul className="orders-cards divide-y divide-gray-100">
              {orders.map((order) => (
                <li key={order.id} className="p-4 sm:px-6 sm:py-5" data-order-card={order.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-gray-500 whitespace-nowrap">
                    <span className="font-semibold text-gray-900">#{order.id}</span> · {formatDate(order.dateOrdered)}
                  </p>
                  <StatusPill order={order} />
                </div>
                <div className="mt-3 flex items-start gap-3">
                  <ProductThumb item={order.firstItem} size="w-11 h-11 sm:w-12 sm:h-12" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 leading-snug">{order.firstItem ? order.firstItem.name : 'No Product'}</p>
                    <CustomerLine order={order} />
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="font-bold text-base sm:text-lg text-gray-900 leading-tight">{peso(order.total)}</p>
                    {order.service && order.service !== 'custom' && (
                      <p className="text-xs text-gray-500 uppercase mt-0.5">{order.service}</p>
                    )}
                  </div>
                </div>
                <OrderActions order={order} adminLevel={data.adminLevel} card className="mt-3 sm:justify-end" {...actionHandlers} />
              </li>
              ))}
            </ul>

            <div className="orders-table overflow-x-auto">
              <table className="w-full">
                <OrdersTableHead />
                <tbody id="ordersTableBody" className="bg-white divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-all duration-200" data-order-id={order.id}>
                      <td className="px-6 py-4"><ProductCell item={order.firstItem} /></td>
                      <td className="px-6 py-4 w-40"><CustomerCell order={order} /></td>
                      <td className="px-6 py-4 w-32">
                        <p className="font-semibold text-gray-900">#{order.id}</p>
                        <p className="text-sm text-gray-500 whitespace-nowrap">{formatDate(order.dateOrdered)}</p>
                      </td>
                      <td className="px-6 py-4 w-32 text-right">
                        <p className="font-bold text-lg text-gray-900">{peso(order.total)}</p>
                        {order.service && order.service !== 'custom' && (
                          <p className="text-xs text-gray-500 uppercase">{order.service}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 w-32 text-center status-cell"><StatusPill order={order} /></td>
                      <td className="px-6 py-4 w-32 text-center">
                        <OrderActions order={order} adminLevel={data.adminLevel} className="justify-center" {...actionHandlers} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
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
          onClose={() => !deleting && setToDelete(null)}
        >
          <button
            type="button"
            id="deleteOrderConfirmYesBtn"
            onClick={handleDelete}
            disabled={deleting}
            className={dangerButton}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            type="button"
            id="deleteOrderConfirmCancelBtn"
            onClick={() => setToDelete(null)}
            disabled={deleting}
            data-autofocus
            className={cancelButton}
          >
            Cancel
          </button>
        </IconModal>
      )}

      {alert && (
        <IconModal id="alertModal" type={alert.type} title={alert.title} message={alert.message} onClose={() => setAlert(null)}>
          <OkButton onClick={() => setAlert(null)} />
        </IconModal>
      )}
    </>
  )
}
