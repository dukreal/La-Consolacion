import { ChevronLeft, ChevronRight, Search, SearchX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ActivityDialog, { ActivityAvatar } from '../../components/admin/ActivityDialog'
import { getLogs } from '../../services/adminService'
import { dayKey, formatDayHeading, formatTimeOnly, isFailedAction } from '../../utils/activityTime'

// The Type chips. The server filters across all logs (see logs.php for which actions each one covers).
const TYPES = [
  { value: '', label: 'All' },
  { value: 'orders', label: 'Orders' },
  { value: 'products', label: 'Products' },
  { value: 'users', label: 'Users' },
]

const pageButtonClass =
  'relative h-9 px-3 rounded-lg border-[1.5px] border-[#d8dce8] bg-white text-sm font-semibold text-[#22306a] [@media(hover:hover)]:hover:border-[#22306a] [@media(hover:hover)]:hover:bg-[#f5f6fa] transition-colors flex items-center gap-1'

// One entry: who, what and when, with the details cut to 2 lines. The whole row opens the full entry.
// Phones: name on top, then the action, the details and the time; from 640px the action and time share the top line.
function LogRow({ log, onOpen }) {
  const failed = isFailedAction(log.action)
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(log)}
        aria-label={`Show details: ${log.action} by ${log.user}`}
        className="log-row w-full text-left flex items-start gap-3 py-3 px-2 -mx-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#2474b6]/40 [@media(hover:hover)]:hover:bg-[#f5f7fb] transition-colors"
      >
        <ActivityAvatar activity={log} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="font-semibold text-gray-900 truncate">{log.user}</span>
            <span className={`hidden sm:inline truncate text-sm font-semibold ${failed ? 'text-red-600' : 'text-[#22306a]'}`}>{log.action}</span>
            <span className="hidden sm:inline ml-auto pl-2 flex-shrink-0 whitespace-nowrap text-xs text-gray-400">{formatTimeOnly(log.createdAt)}</span>
          </div>
          <p className={`sm:hidden text-sm font-semibold ${failed ? 'text-red-600' : 'text-[#22306a]'}`}>{log.action}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-gray-500 break-words line-clamp-2">{log.details}</p>
          {/* Phones: the time gets its own line so the name keeps the top line (like Recent Activity) */}
          <p className="sm:hidden mt-1 text-xs text-gray-400 whitespace-nowrap">{formatTimeOnly(log.createdAt)}</p>
        </div>
        <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0 text-gray-400" aria-hidden="true" />
      </button>
    </li>
  )
}

// Phones: "‹ Prev · Page 4 of 15 · Next ›" (just "‹ · Page 4 of 15 · ›" under 380px). From 640px: "Showing 25–32 of 212" and the page numbers
// (2 on each side of the current page, plus first/last with "..." gaps).
function Pagination({ page, totalPages, total, perPage, type }) {
  const link = (n) => `?page=${n}${type ? `&type=${type}` : ''}`
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  const numbers = []
  for (let i = start; i <= end; i++) numbers.push(i)
  const offset = (page - 1) * perPage
  const numberClass = 'h-9 min-w-9 px-2 rounded-lg text-sm font-semibold flex items-center justify-center'

  // On very narrow phones (under 380px) Prev and Next show only their arrows
  const word = 'max-[379px]:sr-only'
  const prev = page > 1 ? (
    <Link to={link(page - 1)} className={pageButtonClass}>
      <ChevronLeft className="w-4 h-4" /> <span className={word}>Prev</span>
    </Link>
  ) : (
    <span className={`${pageButtonClass} invisible`} aria-hidden="true"><ChevronLeft className="w-4 h-4" /> <span className={word}>Prev</span></span>
  )
  const next = page < totalPages ? (
    <Link to={link(page + 1)} className={pageButtonClass}>
      <span className={word}>Next</span> <ChevronRight className="w-4 h-4" />
    </Link>
  ) : (
    <span className={`${pageButtonClass} invisible`} aria-hidden="true"><span className={word}>Next</span> <ChevronRight className="w-4 h-4" /></span>
  )

  return (
    <nav aria-label="Log pages" className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
      <p className="hidden sm:block text-sm text-gray-500" id="pageInfo">
        Showing {offset + 1}–{Math.min(offset + perPage, total)} of {total}
      </p>
      {/* Phones */}
      <div className="sm:hidden flex w-full items-center justify-between gap-2">
        {prev}
        <span className="text-sm text-gray-600 whitespace-nowrap">Page {page} of {totalPages}</span>
        {next}
      </div>
      {/* 640px and up */}
      <div className="hidden sm:flex items-center gap-1">
        {prev}
        {start > 1 && (
          <>
            <Link to={link(1)} className={`${numberClass} text-gray-700 [@media(hover:hover)]:hover:bg-[#f5f6fa]`}>1</Link>
            {start > 2 && <span className="px-1 text-gray-400">…</span>}
          </>
        )}
        {numbers.map((n) =>
          n === page ? (
            <span key={n} aria-current="page" className={`${numberClass} bg-[#22306a] text-white`}>{n}</span>
          ) : (
            <Link key={n} to={link(n)} className={`${numberClass} text-gray-700 [@media(hover:hover)]:hover:bg-[#f5f6fa]`}>{n}</Link>
          ),
        )}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-gray-400">…</span>}
            <Link to={link(totalPages)} className={`${numberClass} text-gray-700 [@media(hover:hover)]:hover:bg-[#f5f6fa]`}>{totalPages}</Link>
          </>
        )}
        {next}
      </div>
    </nav>
  )
}

export default function Logs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1)
  const typeParam = searchParams.get('type') || ''
  const type = TYPES.some((t) => t.value === typeParam) ? typeParam : ''
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(null) // the entry shown in the pop-up

  useEffect(() => {
    let cancelled = false
    getLogs(page, type)
      .then((d) => { if (!cancelled) { setData(d); setError('') } })
      .catch((e) => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
  }, [page, type])

  // A new type starts again at page 1 (the type is kept in the address, like the page)
  const chooseType = (value) => setSearchParams(value ? { type: value } : {})

  const logs = data?.logs ?? []
  // Like the old page, the search only filters the entries on the current page
  const term = search.toLowerCase().trim()
  const visible = logs.filter((log) =>
    [log.user, log.action, log.details, log.createdAt].some((v) => (v || '').toLowerCase().includes(term)),
  )

  // Group the entries under a heading per day ("Today · Nov 20, 2026", ...)
  const days = []
  for (const log of visible) {
    const key = dayKey(log.createdAt)
    if (!days.length || days[days.length - 1].key !== key) days.push({ key, label: formatDayHeading(log.createdAt), logs: [] })
    days[days.length - 1].logs.push(log)
  }

  return (
    <>
      {/* Title and subtitle: same sizes and spacing as the other admin pages */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-[1.375rem] leading-tight sm:text-4xl font-bold text-gray-800 sm:mb-2" style={{ letterSpacing: '-0.01em' }}>Logs</h1>
        <p className="text-gray-600 text-sm sm:text-lg">Every change made by admins and customers</p>
      </div>

      <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-lg border border-blue-100 mb-8">
        {/* Search (this page) and the Type chips (all logs); the chips slide sideways on phones */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3 mb-2">
          <div className="relative flex-1 basis-[14rem] sm:basis-[20rem] min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              id="searchInput"
              placeholder="Search this page..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-[10px] border border-[#d8dce8] bg-white text-base outline-none focus:border-[#2474b6] focus:ring-4 focus:ring-[#2474b6]/15"
            />
          </div>
          <div id="typeFilter" className="flex gap-2 min-w-0 max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                data-log-type={t.value}
                onClick={() => chooseType(t.value)}
                className={`flex-shrink-0 px-3.5 h-8 rounded-full border text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#2474b6]/40 ${
                  type === t.value ? 'bg-[#eef1f8] border-[#22306a] text-[#22306a] active' : 'bg-white border-gray-300 text-gray-700 [@media(hover:hover)]:hover:border-[#22306a]/50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-600 my-4" id="logsError">{error}</p>}

        <div id="logsList">
          {data && logs.length === 0 && <div className="text-center text-gray-400 py-10">No logs found.</div>}
          {days.map((day) => (
            <section key={day.key}>
              <h2 className="pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-[#2474b6]">{day.label}</h2>
              <ul className="divide-y divide-gray-100">
                {day.logs.map((log) => (
                  <LogRow key={log.id} log={log} onOpen={setOpen} />
                ))}
              </ul>
            </section>
          ))}
          {logs.length > 0 && visible.length === 0 && (
            <div id="noResultsMsg" className="py-10 text-center text-gray-500">
              <div className="flex flex-col items-center gap-2">
                <SearchX className="w-8 h-8 text-gray-400" />
                <span className="text-lg font-medium">No logs found</span>
                <span className="text-sm">Try adjusting your search criteria</span>
              </div>
            </div>
          )}
        </div>

        {data && data.totalPages > 1 && (
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} perPage={data.perPage} type={type} />
        )}
      </div>

      {open && <ActivityDialog activity={open} onClose={() => setOpen(null)} />}
    </>
  )
}
