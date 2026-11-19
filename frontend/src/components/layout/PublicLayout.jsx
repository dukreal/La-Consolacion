import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'

// Wraps the customer pages with the shared header and the soft page background.
// On /shop it also adds "shop-page" (scopes shop.css) and the Shop's gradient background,
// The header stays at the top while scrolling on every page (it used to only on /shop).
export default function PublicLayout() {
  const { pathname } = useLocation()
  const isShop = pathname === '/shop'

  return (
    <div className={`site-bg${isShop ? ' shop-page jewelry-gradient min-h-screen' : ''}`}>
      <Header sticky />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
