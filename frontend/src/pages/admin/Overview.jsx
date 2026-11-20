import { ChevronRight, Clock, Package, PackageCheck, Settings, ShoppingCart, Store, TrendingUp, Truck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useAnimatedModal } from '../../hooks/useAnimatedModal'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { getOverview } from '../../services/adminService'

// One coloured number card (Total Orders, Pending, Processing, Waiting for Buyer).
// Phones: compact, two per row, with the label under the icon and number. Wider screens: as before.
function StatCard({ gradient, icon: Icon, value, label, note, noteIcon: NoteIcon }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl p-3.5 sm:p-6 text-white shadow-xl`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full translate-y-12 -translate-x-12"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="w-9 h-9 sm:w-14 sm:h-14 flex-shrink-0 bg-white bg-opacity-30 rounded-lg sm:rounded-xl flex items-center justify-center backdrop-blur-sm shadow-lg">
            <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-white drop-shadow-lg" />
          </div>
          <div className="text-right">
            <div className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg">{value}</div>
            <div className="hidden sm:block text-white text-base font-semibold drop-shadow-md">{label}</div>
          </div>
        </div>
        <div className="sm:hidden text-white text-sm font-semibold leading-tight drop-shadow-md">{label}</div>
        <div className="flex items-center justify-between gap-2 mt-0.5 sm:mt-0">
          <span className="text-white text-xs sm:text-base font-medium drop-shadow-md">{note}</span>
          <div className="hidden sm:flex items-center text-white">
            <NoteIcon className="w-4 h-4 drop-shadow-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

// "2026-11-20 10:58:31" -> "Nov 20 · 10:58 AM" (short) or "Nov 20, 2026 · 10:58 AM"
function formatActivityTime(value, withYear) {
  const d = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return value
  const day = d.toLocaleDateString('en-US', withYear ? { month: 'short', day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${day} · ${time}`
}

function ActivityAvatar({ activity, size = 'w-10 h-10 text-sm' }) {
  const initials = (activity.firstName || activity.user || '').slice(0, 2).toUpperCase()
  return activity.profileImage ? (
    <img src={`/uploads/profile/${activity.profileImage}`} alt="" className={`${size} flex-shrink-0 rounded-full object-cover border-2 border-white shadow`} />
  ) : (
    <span className={`${size} flex-shrink-0 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-blue-400 text-white shadow border-2 border-white font-bold`}>
      {initials}
    </span>
  )
}

// The person's real role from the users table (nothing if the account no longer exists)
function RoleBadge({ role }) {
  if (role === 'admin') return <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[11px] font-bold">Admin</span>
  if (role === 'user') return <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold">Customer</span>
  return null
}

// One entry of "Recent Activity". Phones: details are cut to 2 lines, the time sits under them,
// and the whole row opens the full entry.
function ActivityRow({ activity, onOpen }) {
  return (
    <li className="relative flex gap-3 py-3 sm:py-4">
      <ActivityAvatar activity={activity} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-gray-800 truncate">{activity.user}</span>
          <RoleBadge role={activity.role} />
          <span className="hidden sm:inline ml-auto pl-2 flex-shrink-0 whitespace-nowrap text-xs text-gray-400">
            {formatActivityTime(activity.createdAt, true)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-gray-700">
          <span className="min-w-0">{activity.action}</span>
          <ChevronRight className="sm:hidden ml-auto w-4 h-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-gray-500 break-words line-clamp-2 sm:line-clamp-none">{activity.details}</p>
        {/* Phones: the time gets its own line so the name keeps the top line */}
        <p className="sm:hidden mt-1 text-[11px] text-gray-400">{formatActivityTime(activity.createdAt, false)}</p>
      </div>
      <button
        type="button"
        onClick={() => onOpen(activity)}
        aria-label={`Show details: ${activity.action} by ${activity.user}`}
        className="sm:hidden absolute inset-0 rounded-xl active:bg-gray-500/5 outline-none focus-visible:ring-2 focus-visible:ring-[#2474b6]/40"
      ></button>
    </li>
  )
}

// Phones: the full entry in a pop-up (same style as the site's other pop-ups)
function ActivityDialog({ activity, onClose }) {
  const { shown, requestClose } = useAnimatedModal(onClose)
  useBodyScrollLock()
  useEscapeKey(true, requestClose)
  const closeButton = useRef(null)
  useEffect(() => {
    closeButton.current?.focus()
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="activityDialogTitle">
      <div
        className={`fixed inset-0 bg-[#22306a]/30 backdrop-blur-[2px] transition-opacity duration-300 ${shown ? 'opacity-100' : 'opacity-0'}`}
        onClick={requestClose}
      ></div>
      <div
        className={`relative w-full max-w-sm bg-white rounded-[18px] border border-[#eef0f5] shadow-[0_12px_40px_rgba(34,48,106,0.18)] p-5 transition-all duration-300 ${
          shown ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="flex items-center gap-3">
          <ActivityAvatar activity={activity} size="w-11 h-11 text-base" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-gray-800 truncate">{activity.user}</span>
              <RoleBadge role={activity.role} />
            </div>
            <div className="text-xs text-gray-500">{formatActivityTime(activity.createdAt, true)}</div>
          </div>
        </div>
        <h3 id="activityDialogTitle" className="mt-4 text-base font-bold text-gray-800">{activity.action}</h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-600 break-words">{activity.details}</p>
        <button
          ref={closeButton}
          type="button"
          onClick={requestClose}
          className="mt-5 w-full py-3 px-4 rounded-[10px] outline-none focus-visible:ring-4 focus-visible:ring-[#2474b6]/25 bg-[#22306a] hover:bg-[#1a2550] text-white font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    </div>,
    document.body,
  )
}

// Admin dashboard home (was admin-overview.php).
export default function Overview() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [openActivity, setOpenActivity] = useState(null) // phones: the entry shown in the pop-up

  useEffect(() => {
    let cancelled = false
    getOverview()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const stats = data?.stats || { totalOrders: 0, pendingOrders: 0, processingOrders: 0, waitingOrders: 0, thisWeek: 0 }

  return (
    <>
      {/* Welcome Section (hidden on phones, where the counters come first) */}
      <div className="hidden sm:block mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome back, {data?.username || 'Admin'}!</h1>
        <p className="text-gray-600 text-lg">Here&apos;s what&apos;s happening with your jewelry business today.</p>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}</div>}

      {/* Stats Cards */}
      <div id="statCards" className="stat-grid grid grid-cols-2 gap-3 sm:gap-6 mb-8">
        <StatCard
          gradient="from-violet-400 via-violet-500 to-violet-600"
          icon={ShoppingCart}
          value={stats.totalOrders}
          label="Total Orders"
          note={`This week: ${stats.thisWeek}`}
          noteIcon={TrendingUp}
        />
        <StatCard
          gradient="from-amber-400 via-amber-500 to-amber-600"
          icon={Package}
          value={stats.pendingOrders}
          label="Pending Orders"
          note="Awaiting processing"
          noteIcon={Clock}
        />
        <StatCard
          gradient="from-sky-400 via-sky-500 to-sky-600"
          icon={Truck}
          value={stats.processingOrders}
          label="Processing"
          note="In production"
          noteIcon={Settings}
        />

        <StatCard
          gradient="from-rose-400 via-rose-500 to-rose-600"
          icon={PackageCheck}
          value={stats.waitingOrders}
          label="Waiting for Buyer"
          note="Ready for pickup"
          noteIcon={Store}
        />
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white/80 rounded-2xl shadow-lg px-4 py-5 sm:p-6 lg:p-8 mb-8">
        <div className="flex items-center justify-between gap-3 mb-1 sm:mb-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Recent Activity</h2>
          <Link to="/admin/logs" className="text-sm sm:text-base text-blue-600 hover:underline font-medium whitespace-nowrap">
            View All Logs
          </Link>
        </div>
        {data && data.recentActivity.length === 0 && (
          <div className="text-gray-400 text-center py-8">No recent activity found.</div>
        )}
        <ul id="recentActivity" className="divide-y divide-gray-100">
          {data?.recentActivity.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} onOpen={setOpenActivity} />
          ))}
        </ul>
      </div>

      {openActivity && <ActivityDialog activity={openActivity} onClose={() => setOpenActivity(null)} />}
    </>
  )
}
