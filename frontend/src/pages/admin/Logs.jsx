import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Filter, Search, SearchX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getLogs } from '../../services/adminService'

const pageLinkClass =
  'px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors'

// Photo of the admin who did the action, or the first 2 letters of their first name
function LogAvatar({ log }) {
  const [failed, setFailed] = useState(false)
  if (log.profileImage && !failed) {
    return (
      <img
        src={`/uploads/profile/${log.profileImage}`}
        alt="Profile"
        onError={() => setFailed(true)}
        className="w-8 h-8 rounded-full object-cover border-2 border-white shadow"
      />
    )
  }
  const initials = (log.firstName || log.user || '').slice(0, 2).toUpperCase()
  return (
    <span className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-blue-400 text-white shadow border-2 border-white font-bold text-sm">
      {initials}
    </span>
  )
}

// Details longer than 120 characters are cut, with a Show More / Show Less button
function Details({ text }) {
  const [open, setOpen] = useState(false)
  const style = { wordBreak: 'break-word', whiteSpace: 'normal' }
  if (text.length <= 120) return <div className="whitespace-normal break-words" style={style}>{text}</div>
  return (
    <div className="details-container" style={style}>
      <div style={style}>{open ? text : text.slice(0, 120) + '...'}</div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="show-more-btn text-blue-600 hover:text-blue-800 text-xs font-medium mt-1"
      >
        {open ? 'Show Less' : 'Show More'}
      </button>
    </div>
  )
}

// Page numbers: 2 on each side of the current page, plus first/last with "..." gaps
function Pagination({ page, totalPages, total, perPage }) {
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  const numbers = []
  for (let i = start; i <= end; i++) numbers.push(i)
  const offset = (page - 1) * perPage

  return (
    <div className="bg-white border-t border-blue-100 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600" id="pageInfo">
          Showing {offset + 1} to {Math.min(offset + perPage, total)} of {total} logs
        </div>
        <div className="flex items-center gap-2">
          {page > 1 && (
            <Link to={`?page=${page - 1}`} className={`flex items-center gap-1 ${pageLinkClass}`}>
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Link>
          )}
          <div className="flex items-center gap-1">
            {start > 1 && (
              <>
                <Link to="?page=1" className={pageLinkClass}>1</Link>
                {start > 2 && <span className="px-2 text-gray-400">...</span>}
              </>
            )}
            {numbers.map((n) =>
              n === page ? (
                <span key={n} className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg">
                  {n}
                </span>
              ) : (
                <Link key={n} to={`?page=${n}`} className={pageLinkClass}>{n}</Link>
              ),
            )}
            {end < totalPages && (
              <>
                {end < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
                <Link to={`?page=${totalPages}`} className={pageLinkClass}>{totalPages}</Link>
              </>
            )}
          </div>
          {page < totalPages && (
            <Link to={`?page=${page + 1}`} className={`flex items-center gap-1 ${pageLinkClass}`}>
              Next
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Logs() {
  const [searchParams] = useSearchParams()
  const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    getLogs(page)
      .then((d) => { if (!cancelled) { setData(d); setError('') } })
      .catch((e) => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
  }, [page])

  const logs = data?.logs ?? []
  // Like the old page, the search only filters the rows on the current page
  const term = search.toLowerCase().trim()
  const visible = logs.filter((log) =>
    [log.user, log.action, log.details, log.createdAt].some((v) => (v || '').toLowerCase().includes(term)),
  )

  return (
    <>
      <h1 className="text-4xl font-bold mb-6" style={{ color: '#629aea' }}>Logs</h1>
      <div className="glass p-6 rounded-2xl mb-8">
        {/* Search and Filter Bar */}
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              id="searchInput"
              placeholder="Search event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          {/* Status and Type had no dropdown on the old page either; kept so the look matches */}
          <div className="relative">
            <button type="button" id="statusBtn" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100">
              <Calendar />
              <span>Status</span>
              <ChevronDown />
            </button>
          </div>
          <div className="relative">
            <button type="button" id="typeBtn" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100">
              <Filter />
              <span>Type</span>
              <ChevronDown />
            </button>
          </div>
        </div>

        {error && <p className="text-red-600 mb-4" id="logsError">{error}</p>}

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left rounded-2xl overflow-hidden shadow-lg border border-blue-100">
            <thead className="bg-blue-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-2 font-bold text-gray-700 w-48">User</th>
                <th className="px-6 py-2 font-bold text-gray-700 w-30 pl-20">Action</th>
                <th className="px-6 py-2 font-bold text-gray-700 flex-1 pl-12">Details</th>
                <th className="px-6 py-2 font-bold text-gray-700 w-30">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-50" id="logsTableBody">
              {data && logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-8">No logs found.</td>
                </tr>
              )}
              {visible.map((log, index) => (
                <tr key={log.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 transition-all`}>
                  <td className="px-6 py-2 text-gray-900 font-semibold align-middle">
                    <div className="flex items-center gap-3">
                      <LogAvatar log={log} />
                      <span className="truncate font-medium" title={log.user}>{log.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-2 text-blue-700 font-semibold align-middle pl-20">{log.action}</td>
                  <td className="px-6 py-2 text-gray-700 align-middle pl-12" style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                    <Details text={log.details} />
                  </td>
                  <td className="px-6 py-2 text-gray-500 align-middle">{log.createdAt}</td>
                </tr>
              ))}
              {logs.length > 0 && visible.length === 0 && (
                <tr id="noResultsMsg">
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <SearchX className="w-8 h-8 text-gray-400" />
                      <span className="text-lg font-medium">No logs found</span>
                      <span className="text-sm">Try adjusting your search criteria</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {data && data.totalPages > 1 && (
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} perPage={data.perPage} />
          )}
        </div>
      </div>
    </>
  )
}
