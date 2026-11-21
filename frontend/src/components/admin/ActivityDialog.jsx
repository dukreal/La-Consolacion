import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAnimatedModal } from '../../hooks/useAnimatedModal'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { formatActivityTime, isFailedAction } from '../../utils/activityTime'

export function ActivityAvatar({ activity, size = 'w-10 h-10 text-sm' }) {
  const initials = (activity.firstName || activity.user || '').slice(0, 2).toUpperCase()
  return activity.profileImage ? (
    <img src={`/uploads/profile/${activity.profileImage}`} alt="" className={`${size} flex-shrink-0 rounded-full object-cover border-2 border-white shadow`} />
  ) : (
    <span className={`${size} flex-shrink-0 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-blue-400 text-white shadow border-2 border-white font-bold`}>
      {initials}
    </span>
  )
}

// The person's real role from the users table (nothing if the account no longer exists)
export function RoleBadge({ role }) {
  if (role === 'admin') return <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[11px] font-bold">Admin</span>
  if (role === 'user') return <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold">Customer</span>
  return null
}

// The full entry in a pop-up (same style as the site's other pop-ups).
// Used by Recent Activity on the Overview (phones) and by every entry on the Logs page.
export default function ActivityDialog({ activity, onClose }) {
  const { shown, requestClose } = useAnimatedModal(onClose)
  useBodyScrollLock()
  useEscapeKey(true, requestClose)
  const closeButton = useRef(null)
  useEffect(() => {
    closeButton.current?.focus()
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="activityDialogTitle">
      <div
        className={`fixed inset-0 bg-[#22306a]/30 backdrop-blur-[2px] transition-opacity duration-300 ${shown ? 'opacity-100' : 'opacity-0'}`}
        onClick={requestClose}
      ></div>
      <div
        className={`relative w-full max-w-sm bg-white rounded-[18px] border border-[#eef0f5] shadow-[0_12px_40px_rgba(34,48,106,0.18)] p-5 transition-all duration-300 ${
          shown ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="flex items-center gap-3">
          <ActivityAvatar activity={activity} size="w-11 h-11 text-base" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-gray-800 truncate">{activity.user}</span>
              <RoleBadge role={activity.role} />
            </div>
            <div className="text-xs text-gray-500">{formatActivityTime(activity.createdAt, true)}</div>
          </div>
        </div>
        <h3 id="activityDialogTitle" className={`mt-4 text-base font-bold ${isFailedAction(activity.action) ? 'text-red-600' : 'text-gray-800'}`}>{activity.action}</h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-600 break-words">{activity.details}</p>
        <button
          ref={closeButton}
          type="button"
          onClick={requestClose}
          className="mt-5 w-full py-3 px-4 rounded-[10px] outline-none focus-visible:ring-4 focus-visible:ring-[#2474b6]/25 bg-[#22306a] hover:bg-[#1a2550] text-white font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    </div>,
    document.body,
  )
}
