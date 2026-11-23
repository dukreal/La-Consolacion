import { useState } from 'react'
import { formatMoney } from '../../utils/formatMoney'
import Skeleton, { LoadingArea } from './Skeleton'

// The "Sales" card on the Overview: money received and best sellers for Today / This week / This month,
// and what active orders still owe at pickup. The figures come from api/admin/overview.php (sales).
// Phones: the period buttons share the width and the three boxes stack. From 640px: two per row, Best sellers on its own row.
// From 80em (1280px at normal text size, later with larger text): all three in one row.

const PERIODS = [
  { id: 'today', label: 'Today', note: 'today' },
  { id: 'week', label: 'This week', note: 'this week' },
  { id: 'month', label: 'This month', note: 'this month' },
]

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

function Box({ title, className = '', children }) {
  return (
    <div className={`min-w-0 rounded-xl border border-[#e5eaf3] bg-white p-4 sm:p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-600">{title}</h3>
      {children}
    </div>
  )
}

export default function SalesSummary({ sales, loading }) {
  const [period, setPeriod] = useState('week') // same default as "This week" on the Orders page
  const current = PERIODS.find((p) => p.id === period)
  const figures = sales?.[period] || { received: 0, payments: 0, best: [] }
  const toCollect = sales?.toCollect || { amount: 0, orders: 0 }

  return (
    <section aria-labelledby="salesTitle" className="bg-white/80 rounded-2xl shadow-lg px-4 py-5 sm:p-6 lg:p-8 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-5">
        <h2 id="salesTitle" className="text-xl sm:text-2xl font-bold text-gray-800">Sales</h2>
        <div role="group" aria-label="Period" className="flex w-full min-[480px]:w-auto gap-1 p-1 rounded-xl bg-[#eef2f8]">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={p.id === period}
              onClick={() => setPeriod(p.id)}
              className={`flex-1 min-[480px]:flex-none min-h-10 px-2 min-[480px]:px-3.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#2474b6]/50 ${
                p.id === period ? 'bg-[#22306a] text-white' : 'text-gray-700 [@media(hover:hover)]:hover:bg-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingArea label="Loading sales…" className="sales-grid grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Same heights as the loaded boxes, so nothing jumps when the figures arrive */}
          {[1, 2].map((n) => (
            <div key={n} className="rounded-xl border border-[#e5eaf3] bg-white p-4 sm:p-5">
              <Skeleton className="h-4 my-0.5 w-28" />
              <Skeleton className="mt-1.5 h-[2.1875rem] w-40" />
              <Skeleton className="mt-1.5 h-4 my-0.5 w-32" />
            </div>
          ))}
          <div className="sm:col-span-2 sales-best rounded-xl border border-[#e5eaf3] bg-white p-4 sm:p-5">
            <Skeleton className="h-4 my-0.5 w-24" />
            <div className="mt-2 space-y-2">
              {[1, 2, 3, 4, 5].map((n) => <Skeleton key={n} className="h-6 w-full" />)}
            </div>
          </div>
        </LoadingArea>
      ) : (
        <div className="sales-grid grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Box title="Money received">
            <p id="salesReceived" className="mt-1.5 text-[1.75rem] leading-tight font-bold text-[#22306a] break-words">₱{formatMoney(figures.received)}</p>
            <p className="mt-1.5 text-sm text-gray-600">
              {figures.payments ? `${plural(figures.payments, 'payment')} ${current.note}` : `No payments ${current.note} yet`}
            </p>
          </Box>

          <Box title="Balances to collect">
            <p id="salesToCollect" className="mt-1.5 text-[1.75rem] leading-tight font-bold text-amber-700 break-words">₱{formatMoney(toCollect.amount)}</p>
            <p className="mt-1.5 text-sm text-gray-600">
              {toCollect.orders ? `${plural(toCollect.orders, 'active order')}, at pickup or before shipping` : 'Nothing to collect right now'}
            </p>
          </Box>

          <Box title="Best sellers" className="sm:col-span-2 sales-best">
            {figures.best.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No items sold {current.note} yet.</p>
            ) : (
              <ol id="salesBest" className="mt-2 space-y-2">
                {figures.best.map((item, i) => (
                  <li key={item.name} className="flex items-center gap-2.5 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-md bg-[#eef2f8] text-[#22306a] text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="flex-1 min-w-0 truncate text-gray-800" title={item.name}>{item.name}</span>
                    <span className="flex-shrink-0 font-semibold text-gray-600 whitespace-nowrap">{item.qty} sold</span>
                  </li>
                ))}
              </ol>
            )}
          </Box>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-gray-500">
        Money received counts downpayments, balance payments and walk-in sales, not cancelled orders. Balances to collect is what active orders
        still owe, whatever the period.
      </p>
    </section>
  )
}
