import { Gem, Mail, Phone, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getOrderDetails, updateOrderStatus } from '../../services/adminService'
import IconModal, { OkButton } from './IconModal'

// Status names and dot colors inside the pop-up (same as the old statusColors)
const STATUS_LABELS = {
  pending: { dot: 'bg-yellow-400', label: 'Pending' },
  processing: { dot: 'bg-blue-400', label: 'Processing' },
  waiting_for_buyer: { dot: 'bg-purple-400', label: 'Waiting for Buyer' },
  completed: { dot: 'bg-green-400', label: 'Completed' },
  cancelled: { dot: 'bg-red-400', label: 'Cancelled' },
}
// Completed and Cancelled are final: they need the extra "Confirm Order" step
const isFinal = (status) => status === 'completed' || status === 'cancelled'
const peso = (n) => '₱' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })
const formatDateTime = (value) =>
  new Date(value.replace(' ', 'T')).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

const sky = 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700'
const emerald = 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
const buttonBase = 'text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg'

function ProductImage({ product }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
      {product.image && !failed ? (
        <img src={`/uploads/${product.folder}/${product.image}`} alt={product.name} onError={() => setFailed(true)} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-violet-400 to-violet-500 flex items-center justify-center">
          <Gem className="w-8 h-8 text-white" />
        </div>
      )}
    </div>
  )
}

// The "Order Details" pop-up (opened by the Details button on the Orders page).
//   orderId: which order; onClose(): close it; onStatusChange(id, status): update the table and cards
export default function OrderDetailsModal({ orderId, onClose, onStatusChange }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState('pending') // the "Change Status" dropdown
  const [busy, setBusy] = useState(false)
  const [askConfirm, setAskConfirm] = useState(false) // "Please confirm it" pop-up
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    getOrderDetails(orderId)
      .then((d) => {
        if (!d.success) throw new Error(d.message || d.error)
        setData(d)
        setSelected(d.order.paid ? d.order.status : 'pending')
      })
      .catch(() => setError('Error loading order details'))
  }, [orderId])

  const order = data?.order
  const current = order?.status
  const unpaid = order && !order.paid
  const locked = order && order.paid && order.dateCompleted && isFinal(current)

  // What the Update Status button says, and whether it can be clicked
  let updateLabel = 'Update Status'
  let updateEnabled = true
  if (unpaid) [updateLabel, updateEnabled] = ['Payment Required', false]
  else if (locked) [updateLabel, updateEnabled] = ['Order Completed', false]
  else if (isFinal(selected)) [updateLabel, updateEnabled] = ['Use Confirm Order', false]
  else if (selected === current) [updateLabel, updateEnabled] = ['No Change Needed', false]
  const showConfirm = order && !unpaid && !locked && isFinal(selected)

  const saveStatus = async (status, successAlert) => {
    setBusy(true)
    try {
      const res = await updateOrderStatus(orderId, status)
      if (res.success) {
        setData((d) => ({
          ...d,
          order: { ...d.order, status, dateCompleted: isFinal(status) ? new Date().toISOString() : d.order.dateCompleted },
        }))
        onStatusChange(orderId, status)
        setAlert(successAlert)
      } else {
        setAlert({ type: 'error', title: 'Error', message: res.message || res.error || 'Failed to update order status' })
      }
    } catch {
      setAlert({ type: 'error', title: 'Error', message: 'Failed to update order status' })
    }
    setBusy(false)
  }

  const handleUpdate = () =>
    saveStatus(selected, { type: 'success', title: 'Status Updated', message: `Order status changed to ${STATUS_LABELS[selected].label}` })

  const handleConfirm = () => {
    setAskConfirm(false)
    saveStatus(selected, { type: 'success', title: 'Success', message: 'Order confirmed successfully!' })
  }

  const statusInfo = unpaid ? { dot: 'bg-orange-500', label: 'Unpaid' } : STATUS_LABELS[current] || STATUS_LABELS.pending
  const customer = data?.customer

  return (
    <div
      id="orderDetailsModal"
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button type="button" id="closeOrderDetailsModal" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl z-10" title="Close">
          &times;
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-sky-50 px-8 py-6 border-b border-gray-200 rounded-t-2xl">
          <h2 className="text-3xl font-bold text-gray-900" id="modalOrderTitle">{order ? `Order #${order.id}` : 'Loading...'}</h2>
          <p className="text-gray-600 mt-1" id="modalOrderDate">Order Date: {order ? formatDateTime(order.dateOrdered) : 'Loading...'}</p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: products */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Products</h3>
                <span id="modalProductCount" className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {data ? `${data.products.length} item${data.products.length !== 1 ? 's' : ''}` : '0 items'}
                </span>
              </div>
              <div className="relative">
                <div id="modalProducts" className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
                  {error && <div className="text-center py-8 text-red-500">{error}</div>}
                  {!data && !error && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto" />
                    </div>
                  )}
                  {data?.products.map((p) => (
                    <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center space-x-4">
                        <ProductImage product={p} />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg">{p.name}</h4>
                          <p className="text-gray-600 text-sm mb-2">{p.description || 'No description available'}</p>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              <span className="font-medium">Qty: {p.quantity}</span>
                              <span className="mx-2">•</span>
                              <span className="font-medium">{peso(p.price)} each</span>
                            </div>
                            <p className="font-bold text-gray-900">{peso(p.total)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-0 left-0 right-2 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-2xl text-gray-900" id="modalTotal">{peso(data?.total ?? 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: buyer and status */}
            <div>
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Buyer Profile</h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md bg-gradient-to-br from-slate-400 to-slate-500 relative overflow-hidden">
                      {customer?.profileImage ? (
                        <img src={`/uploads/profile/${customer.profileImage}`} alt="Profile" className="w-12 h-12 rounded-full object-cover absolute inset-0" />
                      ) : (
                        <User className="w-6 h-6 text-white z-10" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg" id="modalCustomerName">
                        {customer ? (customer.isWalkIn ? 'Walk-in Customer' : customer.name) : 'Loading...'}
                      </p>
                      <p className="text-gray-600">Customer</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700" id="modalCustomerEmail">
                        {customer ? (customer.isWalkIn ? 'Walk-in (Physical Sale)' : customer.email) : 'Loading...'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700" id="modalCustomerMobile">{customer ? customer.mobile : 'Loading...'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Order Status</h3>
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="mb-4">
                    <span className="block text-sm font-semibold text-gray-700 mb-2">Current Status</span>
                    <div className="flex items-center space-x-2 mb-4">
                      <div id="modalStatusDot" className={`w-3 h-3 rounded-full ${order ? statusInfo.dot : ''}`} />
                      <span id="modalStatusLabel" className="font-semibold text-gray-900">{order ? statusInfo.label : 'Loading...'}</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="modalStatusSelect" className="block text-sm font-semibold text-gray-700 mb-2">Change Status</label>
                    <select
                      id="modalStatusSelect"
                      value={selected}
                      onChange={(e) => setSelected(e.target.value)}
                      disabled={!order || unpaid || locked || busy}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    >
                      {Object.entries(STATUS_LABELS).map(([value, s]) => (
                        <option key={value} value={value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      id="modalUpdateStatusBtn"
                      onClick={handleUpdate}
                      disabled={!order || !updateEnabled || busy}
                      className={`${sky} ${buttonBase} ${!order || !updateEnabled ? 'opacity-50 cursor-not-allowed' : 'transform hover:-translate-y-0.5'}`}
                    >
                      {busy && updateEnabled ? 'Updating...' : updateLabel}
                    </button>
                    {showConfirm && (
                      <button
                        type="button"
                        id="modalConfirmOrderBtn"
                        onClick={() => setAskConfirm(true)}
                        disabled={busy}
                        className={`${emerald} ${buttonBase} transform hover:-translate-y-0.5 disabled:opacity-75`}
                      >
                        {busy ? 'Confirming...' : 'Confirm Order'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 rounded-b-2xl">
          <div className="flex justify-end">
            <button type="button" id="modalCloseBtn" onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200">
              Close
            </button>
          </div>
        </div>
      </div>

      {askConfirm && (
        <IconModal
          id="confirmPermanentModal"
          type="warning"
          title="Please confirm it"
          message={`Are you sure you want to mark this order as ${STATUS_LABELS[selected].label.toLowerCase()}? This action is permanent and cannot be undone.`}
        >
          <button type="button" id="confirmPermanentYesBtn" onClick={handleConfirm} className={`${emerald} ${buttonBase}`}>
            Confirm
          </button>
          <button type="button" id="confirmPermanentCancelBtn" onClick={() => setAskConfirm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-semibold transition-colors duration-200">
            Cancel
          </button>
        </IconModal>
      )}

      {alert && (
        <IconModal id="alertModal" type={alert.type} title={alert.title} message={alert.message}>
          <OkButton onClick={() => setAlert(null)} />
        </IconModal>
      )}
    </div>
  )
}
