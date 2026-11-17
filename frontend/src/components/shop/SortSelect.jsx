export default function SortSelect({ value, onChange }) {
  return (
    <div className="flex items-center gap-4">
      <span className="inter text-gray-600 text-sm">Sort by:</span>
      <select
        id="sortSelect"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-white/50 text-gray-700 inter text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
      >
        <option value="featured">Featured</option>
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
        <option value="newest">Newest</option>
        <option value="name-asc">Name: A to Z</option>
        <option value="name-desc">Name: Z to A</option>
      </select>
    </div>
  )
}
