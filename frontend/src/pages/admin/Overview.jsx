import { Clock, Package, PackageCheck, Settings, ShoppingCart, Store, TrendingUp, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

// One line of "Recent Activity"
function ActivityRow({ activity }) {
  const initials = activity.firstName
    ? activity.firstName.slice(0, 2).toUpperCase()
    : (activity.user || '').slice(0, 2).toUpperCase()
  return (
    <div className="flex items-center gap-4 bg-white/60 rounded-xl px-6 py-4 shadow-sm">
      {activity.profileImage ? (
        <img
          src={`/uploads/profile/${activity.profileImage}`}
          alt="Profile"
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
        />
      ) : (
        <span className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-blue-400 text-white shadow border-2 border-white font-bold text-lg">
          {initials}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold">Admin</span>
          <span className="font-semibold text-gray-800 truncate">{activity.user}</span>
        </div>
        <div className="text-sm text-gray-700 font-semibold">{activity.action}</div>
        <div className="text-xs text-gray-500 truncate">{activity.details}</div>
      </div>
      <div className="text-xs text-gray-400 ml-4 whitespace-nowrap">{activity.createdAt}</div>
    </div>
  )
}

// Admin dashboard home (was admin-overview.php).
export default function Overview() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

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
      {/* Welcome Section */}
      <div className="mb-8">
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
      <div className="bg-white/80 rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Recent Activity</h2>
          <Link to="/admin/logs" className="text-blue-600 hover:underline font-medium">
            View All Logs
          </Link>
        </div>
        <div id="recentActivity" className="space-y-4">
          {data && data.recentActivity.length === 0 && (
            <div className="text-gray-400 text-center py-8">No recent activity found.</div>
          )}
          {data?.recentActivity.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
        </div>
      </div>
    </>
  )
}
