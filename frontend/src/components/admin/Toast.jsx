import { useEffect, useState } from 'react'

// Small message in the top-right corner that fades out (the old admin pages showed
// these after a redirect like ?deleted=1). `color` is 'green' or 'red'.
// Give it a new `key` each time so a repeated message starts its timer again.
export default function Toast({ color = 'green', duration = 2000, children }) {
  const [faded, setFaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setFaded(true), duration)
    return () => clearTimeout(timer)
  }, [duration])

  return (
    <div
      role="status"
      className={`toast fixed top-6 right-6 ${color === 'red' ? 'bg-red-500' : 'bg-green-500'} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-500 ${faded ? 'opacity-0 pointer-events-none' : ''}`}
    >
      {children}
    </div>
  )
}
