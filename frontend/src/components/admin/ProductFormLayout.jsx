import { Link } from 'react-router-dom'

// Small blue heading over a group of fields ("Details", "Customer", "Price and stock", ...).
// grid: how many fields sit side by side (default: 1 on phones, 2 from 640px)
export function FormSection({ title, grid = 'sm:grid-cols-2', children }) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#2474b6]">{title}</h2>
      <div className={`grid grid-cols-1 ${grid} gap-4`}>{children}</div>
    </section>
  )
}

const cancelClass =
  'h-11 px-5 rounded-[10px] border-[1.5px] border-[#d8dce8] bg-white text-[#22306a] font-semibold [@media(hover:hover)]:hover:border-[#22306a] [@media(hover:hover)]:hover:bg-[#f5f6fa] transition-colors flex items-center justify-center'
const saveClass =
  'min-h-11 px-4 sm:px-6 py-2 rounded-[10px] bg-[#22306a] hover:bg-[#1a2550] text-white font-semibold leading-tight transition-colors disabled:opacity-60'

// The page around the admin product forms (Add/Edit Premade, Add/Edit Custom Order).
//   Title and subtitle sit where the other admin pages have theirs.
//   Cancel / Save: beside the title from 768px; below that pinned just above the bottom bar, so they never scroll away
//   (beside the title they would squeeze it onto two lines on small screens).
//   The card: photo, the main fields (children) and the price/stock fields (aside).
//     1280px and up: three columns (photo | main fields | price and stock), using the whole width.
//     640-1279px: photo on the left, main fields and then price and stock on the right.
//     Phones: photo on top, then everything in one column.
export default function ProductFormLayout({ title, subtitle, error, notice, photo, aside, saving, savingLabel, submitLabel, onSubmit, children }) {
  const label = saving && savingLabel ? savingLabel : submitLabel
  return (
    <form onSubmit={onSubmit} className="pb-[calc(4.25rem+1px)] md:pb-0">
      <div className="flex items-start justify-between gap-4 mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className="text-[1.375rem] leading-tight sm:text-4xl font-bold text-gray-800 sm:mb-2" style={{ letterSpacing: '-0.01em' }}>{title}</h1>
          {subtitle && <p className="text-gray-600 text-sm sm:text-lg break-words">{subtitle}</p>}
        </div>
        <div className="hidden md:flex flex-shrink-0 gap-3">
          <Link to="/admin/inventory" className={cancelClass}>Cancel</Link>
          <button type="submit" disabled={saving} className={`${saveClass} whitespace-nowrap`}>{label}</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-5">
        {error && (
          <div id="formError" className="mb-5 p-3 rounded-[10px] border border-red-200 bg-red-50 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}
        {notice}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_minmax(0,15rem)]">
          <div className="w-full max-w-[14rem] mx-auto sm:mx-0">{photo}</div>
          <div className="min-w-0 space-y-6">{children}</div>
          <div className="min-w-0 space-y-6 sm:col-start-2 xl:col-start-auto">{aside}</div>
        </div>
      </div>

      {/* Under 768px: fixed right on top of the bottom bar (3.125rem + 12px is its height), so they are always in reach (the form gets matching
          space at its end so the last field can still scroll above them) */}
      <div className="md:hidden fixed inset-x-0 z-30 bottom-[calc(3.125rem+12px+env(safe-area-inset-bottom))] px-4 sm:px-6 py-3 bg-white/95 backdrop-blur-sm border-t border-gray-200">
        <div className="max-w-xl mx-auto grid grid-cols-[auto_minmax(0,1fr)] gap-3">
          <Link to="/admin/inventory" className={cancelClass}>Cancel</Link>
          <button type="submit" disabled={saving} className={saveClass}>{label}</button>
        </div>
      </div>
    </form>
  )
}
