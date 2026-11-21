import { Activity, BarChart3, LogOut, Package, ShoppingCart, Users } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AdminBusyContext } from '../../context/admin-busy-context'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/admin.css'

// Sidebar entries. `match` lists the addresses that light up the entry
// (Orders also covers Walk-in, Inventory also covers its add/edit pages, like the old layout).
const NAV = [
  { to: '/admin', label: 'Overview', icon: BarChart3, match: (path) => path === '/admin' },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, match: (path) => path.startsWith('/admin/orders') || path.startsWith('/admin/walk-in') },
  { to: '/admin/inventory', label: 'Inventory', icon: Package, match: (path) => path.startsWith('/admin/inventory') },
  { to: '/admin/users', label: 'Users', icon: Users, match: (path) => path.startsWith('/admin/users') },
  { to: '/admin/logs', label: 'Logs', icon: Activity, match: (path) => path.startsWith('/admin/logs') },
]

const itemClass = 'w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200'

// The admin frame: top bar and left sidebar (was layout-header.php), with the page in the middle.
export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  // How many pages are reloading right now (see hooks/useRefreshing.js); above 0 the thin bar shows
  const [busy, setBusy] = useState(0)
  const markBusy = useCallback((change) => setBusy((n) => Math.max(0, n + change)), [])

  const initials = (user?.firstName || '').slice(0, 2).toUpperCase()
  const photo = user?.profileImage ? `/uploads/profile/${user.profileImage}` : ''

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    // One screen tall: the top bar stays on top, and only the page area (and the sidebar, if its links ever
    // do not fit) scrolls. No fixed heights, so the frame never ends up taller than the screen.
    <div className="admin-page h-dvh flex flex-col overflow-hidden">
      <header className="glass relative flex-none z-50 px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Link to="/">
                <img src="/images/LCJ.png" alt="LA Consolacion Logo" className="h-12 w-auto" />
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <span className="hidden sm:inline text-sm text-gray-600">Dashboard | Welcome {user?.username || 'Admin'}</span>
            <div className="relative" style={{ zIndex: 9999 }}>
              <Link
                to="/profile"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:shadow-md transition-shadow cursor-pointer border-2 border-white shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                {photo ? (
                  <img src={photo} alt="Profile" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white text-indigo-600 font-bold text-base">
                    {initials || 'A'}
                  </span>
                )}
              </Link>
            </div>
            {/* Phones and tablets: the sidebar becomes the bottom bar, so Log Out moves up here */}
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="lg:hidden w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors duration-200"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* A page is reloading: a thin blue bar slides along the bottom edge of the top bar */}
        {busy > 0 && <div className="refresh-bar" role="progressbar" aria-label="Loading" />}
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="hidden lg:block w-72 flex-none glass p-6 border-r border-gray-200 overflow-y-auto overscroll-contain">
          <nav className="space-y-2">
            {NAV.map(({ to, label, icon: Icon, match }) => (
              <Link
                key={to}
                to={to}
                className={`${itemClass} ${match(pathname) ? 'gradient-deep-blue text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </Link>
            ))}
          </nav>
          <div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 mt-4"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Log Out</span>
            </button>
          </div>
        </aside>

        {/* Below 1024px the page uses the full width and leaves room for the bottom bar (3.125rem + 12px tall).
            Every page ends with the same space as its sides: 16px on phones, 24px on tablets, 32px on desktop.
            scrollbar-gutter: stable keeps the scrollbar's space even when a page is too short to scroll, so the
            content does not get wider or narrower (and jump) when the scrollbar comes and goes. */}
        <main className="flex-1 min-w-0 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] px-4 pt-6 pb-[calc(3.125rem+12px+1rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-[calc(3.125rem+12px+1.5rem+env(safe-area-inset-bottom))] lg:p-8">
          <AdminBusyContext.Provider value={markBusy}>
            <Outlet />
          </AdminBusyContext.Provider>
        </main>
      </div>

      {/* Phones and tablets (under 1024px): the sidebar links as a bar along the bottom */}
      <nav
        aria-label="Admin sections"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-t border-gray-200 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 max-w-xl mx-auto">
          {NAV.map(({ to, label, icon: Icon, match }) => {
            const active = match(pathname)
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 pt-2 pb-2.5 text-[11px] leading-none transition-colors duration-200 ${
                  active ? 'text-[#1f488a] font-semibold' : 'text-gray-500 font-medium hover:text-gray-700'
                }`}
              >
                <span className={`flex items-center justify-center w-12 h-7 rounded-full ${active ? 'gradient-deep-blue text-white shadow' : ''}`}>
                  <Icon className="w-5 h-5" />
                </span>
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
