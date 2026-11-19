// The five category buttons above the products.
const FILTERS = [
  { value: 'all', label: 'All Items' },
  { value: 'ring', label: 'Rings' },
  { value: 'charm', label: 'Charms' },
  { value: 'bracelet', label: 'Bracelets' },
  { value: 'earring', label: 'Earrings' },
]

const activeClass =
  'filter-btn px-6 py-3 rounded-xl text-white font-medium inter transition-all duration-300 luxury-shadow border border-blue-500/30 active'
const inactiveClass =
  'filter-btn px-6 py-3 rounded-xl bg-white/60 backdrop-blur-sm text-gray-600 font-medium inter hover:bg-white/80 hover:text-gray-700 transition-all duration-300 border border-white/30'

export default function CategoryFilter({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-3">
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
