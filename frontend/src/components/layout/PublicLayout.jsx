import { Outlet } from 'react-router-dom'
import Header from './Header'

// Wraps the customer pages with the shared header and the soft page background.
export default function PublicLayout() {
  return (
    <div className="site-bg">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
