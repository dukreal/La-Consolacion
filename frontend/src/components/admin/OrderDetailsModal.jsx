import { Gem, Mail, Phone, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getOrderDetails, updateOrderStatus } from '../../services/adminService'
import { ADMIN_STATUS_OPTIONS, orderStatus } from '../../utils/orderStatus'
import { cancelButton, confirmButton } from '../../utils/dialogButtons'
import BalanceModal from './BalanceModal'
import IconModal, { OkButton } from './IconModal'

// Status names (admin wording) and dot colors come from utils/orderStatus.js, shared with the customer side
const statusLabel = (status) => orderStatus(status, { admin: true }).label
// Completed and Cancelled are final: they need the extra "Confirm Order" step
const isFinal = (status) => status === 'completed' || status === 'cancelled'
const peso = (n) => '₱' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })
// "2026-11-19 10:00:00" -> "Nov 19, 2026 · 10:00 AM"
const formatDateTime = (value) => {
  const d = new Date(value.replace(' ', 'T'))
  const day = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${day} · ${time}`
}

// Long emails may wrap only before "@" or a dot, never in the middle of a word
const breakableEmail = (email) =>
  String(email ?? '')
    .split(/(?=[@.])/)
    .flatMap((part, i) => (i ? [<wbr key={i} />, part] : [part]))

// Site palette: navy for the main action, green for the permanent "Confirm Order" step, navy outline for Close
const navyButton = 'bg-[#22306a] hover:bg-[#1a2550] text-white'
const greenButton = 'bg-emerald-600 hover:bg-emerald-700 text-white'
const buttonBase = 'h-11 px-5 rounded-[10px] font-semibold whitespace-nowrap transition-colors duration-200 outline-none focus-visible:ring-4 focus-visible:ring-[#2474b6]/25'
const outlineButton = 'border-[1.5px] border-[#d8dce8] bg-white text-[#22306a] hover:border-[#22306a] hover:bg-[#f5f6fa]'

function ProductImage({ product }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
      {product.image && !failed ? (
        <img src={`/uploads/${product.folder}/${product.image}`} alt={product.name} onError={() => setFailed(true)} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-violet-400 to-violet-500 flex items-center justify-center">
          <Gem className="w-6 h-6 text-white" />
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
  const [askBalance, setAskBalance] = useState(false) // "Collect the balance" pop-up (Completed with money still owed)
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

  // Completed / Cancelled picked: only the green Confirm Order button shows (it asks before saving).
  // Otherwise: the Update Status button, with what it says and whether it can be clicked.
  const showConfirm = order && !unpaid && !locked && isFinal(selected)
  let updateLabel = 'Update Status'
  let updateEnabled = true
  if (unpaid) [updateLabel, updateEnabled] = ['Payment Required', false]
  else if (locked) [updateLabel, updateEnabled] = ['Order Completed', false]
  else if (selected === current) [updateLabel, updateEnabled] = ['No Change Needed', false]

  // balance: { method, reference } when the balance paid at pickup is recorded with Completed
  const saveStatus = async (status, successAlert, balance) => {
    setBusy(true)
    try {
      const res = await updateOrderStatus(orderId, status, balance)
      if (res.success) {
        setData((d) => ({
          ...d,
          order: { ...d.order, status, dateCompleted: isFinal(status) ? new Date().toISOString() : d.order.dateCompleted },
          ...(res.balanceRecorded ? { paid: d.total, balance: 0 } : {}),
        }))
        setAskBalance(false)
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
    saveStatus(selected, { type: 'success', title: 'Status Updated', message: `Order status changed to ${statusLabel(selected)}` })

  const handleConfirm = () => {
    setAskConfirm(false)
    saveStatus(selected, { type: 'success', title: 'Success', message: 'Order confirmed successfully!' })
  }

  // Confirm Order: Completed while the customer still owes money asks how the balance was paid first
  const needsBalance = selected === 'completed' && (data?.balance ?? 0) > 0
  const handleBalance = (balance) =>
    saveStatus('completed', {
      type: 'success',
      title: 'Order Completed',
      message: `Balance of ${peso(data.balance)} recorded. The order is fully paid.`,
    }, balance)

  const statusInfo = orderStatus(current, { admin: true, unpaid })
  const customer = data?.customer

  const sectionTitle = 'text-sm font-semibold uppercase tracking-wider text-gray-500'

  // Phones: one column (status, products, buyer). From 640px: the status row on top, then products and buyer as
  // two equal columns of the same height. The buyer column sets that height (at least 17rem); a long product list
  // scrolls inside its column with Total pinned at the bottom, so neither side is left half empty.
  return (
    <div
      id="orderDetailsModal"
      className="fixed inset-0 bg-[#22306a]/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[18px] border border-[#eef0f5] shadow-[0_12px_40px_rgba(34,48,106,0.18)] w-full max-w-3xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header: order number, date, current status */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 sm:px-6 border-b border-gray-100">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-[#22306a]" id="modalOrderTitle">{order ? `Order #${order.id}` : 'Loading...'}</h2>
            <p className="text-sm text-gray-500 mt-0.5" id="modalOrderDate">{order ? formatDateTime(order.dateOrdered) : 'Loading...'}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {order && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs sm:text-sm font-medium border ${statusInfo.badge}`}>
                <span id="modalStatusDot" className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                <span id="modalStatusLabel">{statusInfo.label}</span>
              </span>
            )}
            <button
              type="button"
              id="closeOrderDetailsModal"
              onClick={onClose}
              title="Close"
              aria-label="Close"
              className="w-9 h-9 -mr-1.5 rounded-full flex items-center justify-center text-2xl leading-none text-gray-400 hover:bg-[#f5f6fa] hover:text-[#22306a] transition-colors outline-none focus-visible:ring-4 focus-visible:ring-[#2474b6]/25"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Change status: right under the header */}
          <div className="bg-[#f5f7fb] px-5 py-4 sm:px-6 border-b border-gray-100">
            <label htmlFor="modalStatusSelect" className="block text-sm font-semibold text-gray-700 mb-2">Change Status</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <select
                id="modalStatusSelect"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                disabled={!order || unpaid || locked || busy}
                className="h-11 w-full sm:flex-1 min-w-0 px-3 bg-white border border-[#d8dce8] rounded-[10px] text-gray-900 outline-none focus:border-[#2474b6] focus:ring-4 focus:ring-[#2474b6]/15 disabled:bg-gray-100 disabled:text-gray-500"
              >
                {ADMIN_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {!showConfirm && (
                <button
                  type="button"
                  id="modalUpdateStatusBtn"
                  onClick={handleUpdate}
                  disabled={!order || !updateEnabled || busy}
                  className={`${navyButton} ${buttonBase} ${!order || !updateEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {busy && updateEnabled ? 'Updating...' : updateLabel}
                </button>
              )}
              {showConfirm && (
                <button
                  type="button"
                  id="modalConfirmOrderBtn"
                  onClick={() => (needsBalance ? setAskBalance(true) : setAskConfirm(true))}
                  disabled={busy}
                  className={`${greenButton} ${buttonBase} disabled:opacity-75`}
                >
                  {busy ? 'Confirming...' : 'Confirm Order'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 sm:min-h-[17rem] sm:divide-x divide-gray-100">
            {/* Products */}
            <div className="flex flex-col px-5 py-5 sm:px-6 sm:h-0 sm:min-h-full">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <h3 className={sectionTitle}>Products</h3>
                <span id="modalProductCount" className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {data ? `${data.products.length} item${data.products.length !== 1 ? 's' : ''}` : '0 items'}
                </span>
              </div>
              <div id="modalProducts" className="divide-y divide-gray-100 sm:flex-1 sm:min-h-0 sm:overflow-y-auto sm:-mr-2 sm:pr-2">
                {error && <div className="text-center py-8 text-red-500">{error}</div>}
                {!data && !error && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2474b6] mx-auto" />
                  </div>
                )}
                {data?.products.map((p) => (
                  <div key={p.id} className="flex items-start gap-3 py-3 first:pt-0">
                    <ProductImage product={p} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 leading-snug">{p.name}</h4>
                      <p className="text-gray-500 text-sm line-clamp-2">{p.description || 'No description available'}</p>
                      {/* The line total sits at the end of this line; it drops below it only when there is no room */}
                      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="text-sm text-gray-500">Qty {p.quantity} · {peso(p.price)} each</span>
                        <span className="font-bold text-gray-900 whitespace-nowrap">{peso(p.total)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-4 flex-shrink-0">
                <div className="flex justify-between items-center border-t border-gray-200 pt-4">
                  <span className="font-semibold text-gray-700">Total</span>
                  <span className="font-bold text-xl sm:text-2xl text-[#22306a]" id="modalTotal">{peso(data?.total ?? 0)}</span>
                </div>
                {/* Paid orders: what is paid so far and what is left to collect at pickup */}
                {order?.paid && typeof data.balance === 'number' && (
                  <div id="modalPaidLine" className="mt-1 flex justify-between gap-3 text-sm">
                    <span className="text-gray-500">Paid {peso(data.paid ?? 0)}</span>
                    {data.balance > 0 ? (
                      <span className="font-semibold text-amber-700">Balance {peso(data.balance)}</span>
                    ) : (
                      <span className="font-semibold text-emerald-700">Fully paid</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Buyer */}
            <div className="px-5 py-5 sm:px-6 border-t border-gray-100 sm:border-t-0">
              <h3 className={`${sectionTitle} mb-3`}>Buyer Profile</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center shadow-md bg-gradient-to-br from-slate-400 to-slate-500 relative overflow-hidden">
                  {customer?.profileImage ? (
                    <img src={`/uploads/profile/${customer.profileImage}`} alt="Profile" className="w-12 h-12 rounded-full object-cover absolute inset-0" />
                  ) : (
                    <User className="w-6 h-6 text-white z-10" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-lg leading-tight truncate" id="modalCustomerName">
                    {customer ? (customer.isWalkIn ? 'Walk-in Customer' : customer.name) : 'Loading...'}
                  </p>
                  <p className="text-sm text-gray-500">Customer</p>
                </div>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                  <span className="text-gray-700 min-w-0 [overflow-wrap:anywhere]" id="modalCustomerEmail">
                    {customer ? (customer.isWalkIn ? 'Walk-in (Physical Sale)' : breakableEmail(customer.email)) : 'Loading...'}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                  <span className="text-gray-700" id="modalCustomerMobile">{customer ? customer.mobile : 'Loading...'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 sm:px-6 border-t border-gray-100 flex justify-end">
          <button type="button" id="modalCloseBtn" onClick={onClose} className={`${outlineButton} ${buttonBase} w-full sm:w-auto`}>
            Close
          </button>
        </div>
      </div>

      {askBalance && data && (
        <BalanceModal
          orderId={orderId}
          total={data.total}
          paid={data.paid ?? 0}
          balance={data.balance}
          busy={busy}
          onConfirm={handleBalance}
          onCancel={() => setAskBalance(false)}
        />
      )}

      {askConfirm && (
        <IconModal
          id="confirmPermanentModal"
          type="warning"
          title="Please confirm it"
          message={`Are you sure you want to mark this order as ${statusLabel(selected).toLowerCase()}? This action is permanent and cannot be undone.`}
          onClose={() => setAskConfirm(false)}
        >
          <button type="button" id="confirmPermanentYesBtn" onClick={handleConfirm} className={confirmButton}>
            Confirm
          </button>
          <button type="button" id="confirmPermanentCancelBtn" onClick={() => setAskConfirm(false)} data-autofocus className={cancelButton}>
            Cancel
          </button>
        </IconModal>
      )}

      {alert && (
        <IconModal id="alertModal" type={alert.type} title={alert.title} message={alert.message} onClose={() => setAlert(null)}>
          <OkButton onClick={() => setAlert(null)} />
        </IconModal>
      )}
    </div>
  )
}
