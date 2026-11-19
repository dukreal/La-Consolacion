// The five category buttons above the products.
const FILTERS = [
  { value: 'all', label: 'All Items' },
  { value: 'ring', label: 'Rings' },
  { value: 'charm', label: 'Charms' },
  { value: 'bracelet', label: 'Bracelets' },
  { value: 'earring', label: 'Earrings' },
]

// Smaller on phones (px-4 py-2 text-sm), the original size from 640px up (sm:)
const sizeClass = 'shrink-0 whitespace-nowrap px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base'
const activeClass = `filter-btn ${sizeClass} rounded-xl text-white font-medium inter transition-all duration-300 luxury-shadow border border-blue-500/30 active`
const inactiveClass = `filter-btn ${sizeClass} rounded-xl bg-white/60 backdrop-blur-sm text-gray-600 font-medium inter hover:bg-white/80 hover:text-gray-700 transition-all duration-300 border border-white/30`

export default function CategoryFilter({ active, onChange }) {
  return (
    // Phones: one row you can swipe sideways (no wrapping into 3 rows). From 640px up: wraps like before.
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0">
      {FILTERS.map((filter) => {
        const isActive = filter.value === active
        return (
          <button
            key={filter.value}
            className={isActive ? activeClass : inactiveClass}
            style={isActive ? { backgroundColor: '#22306a' } : undefined}
            onClick={() => onChange(filter.value)}
          >
            {filter.label}
          </button>
        )
      })}
    </div>
  )
}
