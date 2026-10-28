import { Outlet } from 'react-router-dom'
import Header from './Header'

// Wraps every public/customer page with the shared header.
export default function PublicLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  )
}