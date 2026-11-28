import { Search, X } from 'lucide-react'
import { orderStatus } from '../../utils/orderStatus'

// The status buttons, in the order an order goes through them. The labels are the same short ones the
// list uses ("Waiting" is Waiting for Buyer: ready for pickup, or ready to ship).
const STATUS_CHIPS = ['all', 'pending', 'processing', 'waiting_for_buyer', 'completed', 'cancelled']
const TYPES = [
  { value: 'all', label: 'All' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'delivery', label: 'Delivery' },
]

const chipLabel = (status) => (status === 'all' ? 'All' : orderStatus(status, { admin: true, short: true }).label)

// Search box, Type (All / Pickup / Delivery) and the status buttons with how many orders each has.
// search: what is typed (the list follows a moment after typing stops); counts: from the server, for the
// current search and type. Changing any of them goes back to page 1 (Orders.jsx).
export default function OrderFilters({ search, onSearch, type, onType, status, onStatus, counts }) {
  return (
    <div className="mt-3 sm:mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
        <div className="relative flex-1 min-w-0">
          <label htmlFor="orderSearch" className="sr-only">
            Search orders
          </label>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
          <input
            id="orderSearch"
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search orders"
            aria-describedby="orderSearchHint"
            autoComplete="off"
            maxLength={100}
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-gray-300 bg-white text-gray-900 text-base placeholder:text-gray-400 focus:outline-none focus:border-[#2474b6] focus:ring-2 focus:ring-[#2474b6]/20 [&::-webkit-search-cancel-button]:hidden"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 [@media(hover:hover)]:hover:text-gray-700 [@media(hover:hover)]:hover:bg-gray-100"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-none" role="group" aria-label="Type">
          <span className="text-sm text-gray-600">Type</span>
          <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden bg-white">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => onType(t.value)}
                aria-pressed={type === t.value}
                className={`px-3 py-1.5 text-sm font-semibold border-l border-gray-200 first:border-l-0 ${
                  type === t.value ? 'bg-[#e8edf8] text-[#22306a]' : 'text-gray-600 [@media(hover:hover)]:hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p id="orderSearchHint" className="text-xs text-gray-500 mt-1.5">
        Order no. (37, #37 or LCJ-0037), customer name, username or email
      </p>

      {/* One row that scrolls sideways on phones (it never makes the page wider), wraps on wider screens */}
      <div className="mt-3 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto sm:overflow-visible" role="group" aria-label="Status">
        <div className="flex sm:flex-wrap gap-2 w-max sm:w-auto pb-1 sm:pb-0">
          {STATUS_CHIPS.map((s) => {
            const on = status === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => onStatus(s)}
                aria-pressed={on}
                className={`flex-none inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border whitespace-nowrap ${
                  on
                    ? 'bg-[#22306a] border-[#22306a] text-white'
                    : 'bg-white border-gray-300 text-gray-700 [@media(hover:hover)]:hover:border-[#22306a]/40 [@media(hover:hover)]:hover:bg-gray-50'
                }`}
              >
                {chipLabel(s)}
                <span className={`font-medium ${on ? 'text-white/75' : 'text-gray-500'}`}>{counts ? counts[s] : '–'}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// The page numbers to show: always the first and last, and the ones next to the current page
// (1 … 4 5 6 … 12). null is a gap.
function pageList(page, pages) {
  const shown = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages))
  const list = []
  ;[...shown]
    .sort((a, b) => a - b)
    .forEach((n, i, all) => {
      if (i > 0 && n - all[i - 1] > 1) list.push(null)
      list.push(n)
    })
  return list
}

// "Showing 21–40 of 57 orders" and Previous / 1 2 3 / Next (the buttons only when there is more than one page)
export function OrderPager({ page, pages, perPage, matching, shownCount, filtered, onPage }) {
  const first = matching === 0 ? 0 : (page - 1) * perPage + 1
  const last = (page - 1) * perPage + shownCount
  const navButton =
    'h-9 px-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 bg-white disabled:text-gray-300 disabled:cursor-not-allowed [@media(hover:hover)]:enabled:hover:bg-gray-50'
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 sm:px-6 border-t border-gray-200 bg-slate-50">
      <p className="text-sm text-gray-600 text-center sm:text-left" aria-live="polite">
        Showing <b>{first}–{last}</b> of <b>{matching}</b> {matching === 1 ? 'order' : 'orders'}
        {filtered ? ' found' : ''}
      </p>
      {pages > 1 && (
        <nav className="flex items-center gap-1.5 flex-wrap justify-center" aria-label="Pages">
          <button type="button" className={navButton} disabled={page <= 1} onClick={() => onPage(page - 1)}>
            ‹ Previous
          </button>
          {pageList(page, pages).map((n, i) =>
            n === null ? (
              <span key={`gap${i}`} className="px-1 text-gray-400" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => onPage(n)}
                aria-current={n === page ? 'page' : undefined}
                aria-label={`Page ${n}`}
                className={`h-9 min-w-9 px-2.5 rounded-lg text-sm font-semibold ${
                  n === page ? 'bg-[#22306a] text-white' : 'border border-gray-200 bg-white text-gray-700 [@media(hover:hover)]:hover:bg-gray-50'
                }`}
              >
                {n}
              </button>
            )
          )}
          <button type="button" className={navButton} disabled={page >= pages} onClick={() => onPage(page + 1)}>
            Next ›
          </button>
        </nav>
      )}
    </div>
  )
}
