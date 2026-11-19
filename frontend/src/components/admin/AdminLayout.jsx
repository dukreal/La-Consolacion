import { Activity, BarChart3, LogOut, Package, ShoppingCart, Users } from 'lucide-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
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

  const initials = (user?.firstName || '').slice(0, 2).toUpperCase()
  const photo = user?.profileImage ? `/uploads/profile/${user.profileImage}` : ''

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="admin-page min-h-screen overflow-hidden">
      <header className="glass sticky top-0 z-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Link to="/">
                <img src="/images/LCJ.png" alt="LA Consolacion Logo" className="h-12 w-auto" />
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Dashboard | Welcome {user?.username || 'Admin'}</span>
            <div className="relative" style={{ zIndex: 9999 }}>
              <Link
                to="/profile"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-105 transition-transform cursor-pointer border-2 border-white shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
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
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)] overflow-hidden">
        <aside className="fixed top-[80px] left-0 w-72 h-[calc(100vh-80px)] glass p-6 border-r border-gray-200 overflow-y-auto">
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

        <main className="flex-1 p-8 ml-72 overflow-y-auto h-[calc(100vh-80px)]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
