import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const navLink =
  'inter text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium'

// Full class names are listed so Tailwind can find them (it can't see "bg-${color}-50").
const tints = {
  blue: { box: 'bg-blue-50', icon: 'text-blue-600' },
  green: { box: 'bg-green-50', icon: 'text-green-600' },
  red: { box: 'bg-red-50', icon: 'text-red-600' },
}

function MenuLink({ to, icon, label, color = 'blue', extraClass = '', onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 group mx-1 ${extraClass}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${tints[color].box}`}>
        <i className={`bx ${icon} text-base ${tints[color].icon}`}></i>
      </div>
      <span className="font-medium">{label}</span>
      <i className="bx bx-chevron-right ml-auto text-gray-400"></i>
    </Link>
  )
}

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  // Close the dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const profileName = user ? user.username || user.firstName || 'User' : 'Guest'
  const profileEmail = user ? user.email : 'Not logged in'
  const initial = user ? (user.firstName || '').slice(0, 2).toUpperCase() || 'U' : 'G'
  const profileImg = user?.profileImage ? `/uploads/profile/${user.profileImage}` : ''
  const close = () => setOpen(false)

  const handleLogout = async () => {
    await logout()
    close()
    navigate('/login')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 w-full">
      <div className="w-full px-6">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/">
            <img src="/images/LCJ.png" alt="LA CONSOLACION Jewelry Logo" className="h-12 w-auto" />
          </Link>

          <div className="flex items-center space-x-8">
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/shop" className={navLink}>Shop All</Link>
              <Link to="/#steps" className={navLink}>Order Custom</Link>
              <Link to="/#about" className={navLink}>About Us</Link>
              <Link to="/#contact" className={navLink}>Contact Us</Link>
            </nav>

            {/* Profile button + dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen((o) => !o)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 transition-transform cursor-pointer border-2 border-white shadow-md"
                style={{ background: 'linear-gradient(135deg, #2474b6 0%, #1e5a8a 100%)' }}
              >
                {profileImg ? (
                  <img src={profileImg} alt="Profile" className="w-8 h-8 rounded-full object-cover shadow-md" />
                ) : (
                  <span className="text-indigo-600 font-bold text-sm">{initial}</span>
                )}
              </button>

              <div
                className={`absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 transform transition-all duration-300 ease-out backdrop-blur-sm ${
                  open ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible pointer-events-none'
                }`}
              >
                {/* User info */}
                <div
                  className="px-6 py-4 rounded-t-2xl mb-2"
                  style={{ background: 'linear-gradient(135deg, #2474b6 0%, #1e5a8a 100%)' }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                      {profileImg ? (
                        <img src={profileImg} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white flex items-center justify-center border-2 border-white shadow-md">
                          <span className="text-indigo-600 font-bold text-sm">{initial}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white truncate">{profileName}</div>
                      <div className="text-xs text-white/80 truncate mt-0.5">{profileEmail}</div>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="px-2">
                  {user ? (
                    <>
                      <MenuLink to="/profile" icon="bx-user" label="View Profile" onClick={close} />
                      {user.role === 'admin' && (
                        <MenuLink to="/admin" icon="bx-cog" label="Admin Dashboard" extraClass="mt-1" onClick={close} />
                      )}
                      <MenuLink to="/shop?openCart=true" icon="bx-cart" label="My Cart" extraClass="mt-1" onClick={close} />
                      <MenuLink to="/shop?openOrderHistory=true" icon="bx-history" label="Order History" color="green" extraClass="mt-1" onClick={close} />

                      <div className="border-t border-gray-100 mt-2 pt-2 px-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group mx-1"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${tints.red.box}`}>
                            <i className={`bx bx-log-out text-base ${tints.red.icon}`}></i>
                          </div>
                          <span className="font-medium">Logout</span>
                          <i className="bx bx-chevron-right ml-auto text-red-600"></i>
                        </button>
                      </div>
                    </>
                  ) : (
                    <MenuLink to="/login" icon="bx-log-in" label="Login" onClick={close} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu button (same as the original: no action yet) */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <i className="bx bx-menu text-2xl text-gray-700"></i>
          </button>
        </div>
      </div>
    </header>
  )
}