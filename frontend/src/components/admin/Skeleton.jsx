// A gray placeholder block shown where text, a picture or a button will be once the page's data has loaded.
// It pulses gently (opacity only); the pulse stops when the device is set to reduce motion.
// tone="light": a see-through white block, for the coloured counter cards.
export default function Skeleton({ className = '', tone = 'gray' }) {
  const color = tone === 'light' ? 'bg-white/35' : 'bg-[#e4e9f2]'
  return <span aria-hidden="true" className={`block rounded-md ${color} motion-safe:animate-pulse ${className}`} />
}

// Wraps the placeholders of one list or form so screen readers hear "Loading orders…" instead of nothing
export function LoadingArea({ label, className = '', children }) {
  return (
    <div aria-busy="true" className={className}>
      <span className="sr-only" role="status">{label}</span>
      {children}
    </div>
  )
}
