import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const navLink =
  'inter text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium whitespace-nowrap'
const mobileLink =
  'block px-6 py-3 inter text-gray-700 font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200'

// The page links: in the bar from 1024px up, in the hamburger menu on phones and tablets
// (at 768px there is not enough room once the page is zoomed in, and the links wrapped onto two lines)
const NAV_LINKS = [
  { to: '/shop', label: 'Shop All' },
  { to: '/#steps', label: 'Order Custom' },
  { to: '/#about', label: 'About Us' },
  { to: '/#contact', label: 'Contact Us' },
]

// Full class names are listed so Tailwind can find them (it can't see "bg-${color}-50").
const tints = {
  blue: { box: 'bg-blue-50', icon: 'text-blue-600' },
  green: { box: 'bg-green-50', icon: 'text-green-600' },
  red: { box: 'bg-red-50', icon: 'text-red-600' },
}

// How far to move the profile menu so it stays on screen. On wide screens it opens right-aligned
// under the avatar; on phones (under 768px) it lines up with the right edge of the screen, 16px in.
const MENU_GAP = 16
function menuOffset(anchor) {
  if (!anchor) return 0
  const box = anchor.getBoundingClientRect()
  const width = Math.min(288, window.innerWidth - MENU_GAP * 2)
  const screenRight = window.innerWidth - MENU_GAP
  const right = window.innerWidth < 768 ? screenRight : Math.min(Math.max(box.right, MENU_GAP + width), screenRight)
  return box.right - right
}

function MenuLink({ to, icon, label, color = 'blue', extraClass = '', onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#2474b6]/10 rounded-xl transition-all duration-200 group mx-1 ${extraClass}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${tints[color].box}`}>
        <i className={`bx ${icon} text-base ${tints[color].icon}`}></i>
      </div>
      <span className="font-medium">{label}</span>
      <i className="bx bx-chevron-right ml-auto text-gray-400"></i>
    </Link>
  )
}

export default function Header({ sticky = false }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false) // profile dropdown
  const [mobileOpen, setMobileOpen] = useState(false) // hamburger menu (phones)
  const [menuShift, setMenuShift] = useState(0) // see menuOffset()
  const menuRef = useRef(null)
  const mobileRef = useRef(null)

  // Close the menus when clicking outside them or pressing Escape
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
      if (mobileRef.current && !mobileRef.current.contains(e.target)) setMobileOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setMobileOpen(false)
      }
    }
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  // Keep the open profile menu on screen when the window is resized or rotated
  useEffect(() => {
    if (!open) return
    const onResize = () => setMenuShift(menuOffset(menuRef.current))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [open])

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
    <header className={`bg-white shadow-sm border-b border-gray-100 ${sticky ? 'sticky top-0 z-50 ' : 'relative z-50 '}w-full`}>
      {/* Same max width and side spacing as the page sections, so the logo and links line up with the content */}
      <div className="mx-auto w-full max-w-[1360px] px-[clamp(24px,4vw,56px)]">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          {/* flex-shrink-0: the logo keeps its size and never slides under the links */}
          <Link to="/" className="flex-shrink-0">
            <img src="/images/LCJ.png" alt="LA CONSOLACION Jewelry Logo" className="h-12 w-auto" />
          </Link>

          {/* ml-auto keeps the links and profile button on the right, next to the hamburger on phones and tablets */}
          <div className="ml-auto flex items-center space-x-8">
            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              {NAV_LINKS.map((l) => (
                <Link key={l.to} to={l.to} className={navLink}>{l.label}</Link>
              ))}
            </nav>

            {/* Profile button + dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => {
                  setMenuShift(menuOffset(menuRef.current))
                  setOpen((o) => !o)
                  setMobileOpen(false)
                }}
                aria-label="Account menu"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:shadow-lg transition-shadow cursor-pointer border-2 border-white shadow-md"
                style={{ background: 'linear-gradient(135deg, #2474b6 0%, #1e5a8a 100%)' }}
              >
                {profileImg ? (
                  <img src={profileImg} alt="Profile" className="w-8 h-8 flex-shrink-0 rounded-full object-cover shadow-md" />
                ) : (
                  <span className="text-white font-bold text-sm">{initial}</span>
                )}
              </button>

              <div
                style={{ right: menuShift, width: 'min(18rem, calc(100vw - 32px))' }}
                className={`absolute mt-3 max-h-[calc(100vh-96px)] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-100 pb-2 z-50 transform transition-all duration-300 ease-out backdrop-blur-sm ${
                  open ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible pointer-events-none'
                }`}
              >
                {/* User info */}
                <div
                  className="px-6 py-4 rounded-t-2xl mb-2"
                  style={{ background: 'linear-gradient(135deg, #2474b6 0%, #1e5a8a 100%)' }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden">
                      {profileImg ? (
                        <img src={profileImg} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white flex items-center justify-center border-2 border-white shadow-md">
                          <span className="text-indigo-600 font-bold text-sm">{initial}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
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

                      <div className="border-t border-gray-100 mt-2 pt-2 px-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-100 rounded-xl transition-all duration-200 group"
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

          {/* Hamburger menu (phones and tablets): the same page links as the bar above */}
          <div className="lg:hidden" ref={mobileRef}>
            <button
              id="mobileMenuBtn"
              onClick={() => { setMobileOpen((o) => !o); setOpen(false) }}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className="p-2 ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <i className={`bx ${mobileOpen ? 'bx-x' : 'bx-menu'} text-2xl text-gray-700`}></i>
            </button>
            <nav
              id="mobileMenu"
              className={`absolute left-0 right-0 top-full bg-white border-t border-gray-100 shadow-lg py-2 origin-top transform transition-all duration-200 ease-out ${
                mobileOpen ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-95 invisible pointer-events-none'
              }`}
            >
              {NAV_LINKS.map((l) => (
                <Link key={l.to} to={l.to} className={mobileLink} onClick={() => setMobileOpen(false)}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}