import { Edit3, Search, SearchX, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import Skeleton, { LoadingArea } from '../../components/admin/Skeleton'
import { useAuth } from '../../hooks/useAuth'
import { useDialog } from '../../hooks/useDialog'
import { refreshingClass, useRefreshing } from '../../hooks/useRefreshing'
import { deleteUser, getUsers, updateUser } from '../../services/adminService'

const ROLE_LABEL = { user: 'Customer', 'admin-1': 'Admin', 'admin-2': 'SuperAdmin' }
// Site palette: SuperAdmin solid navy, Admin light blue, Customer light grey
const ROLE_CLASS = {
  user: 'bg-slate-100 text-slate-600',
  'admin-1': 'bg-[#e3eefa] text-[#1f5f99]',
  'admin-2': 'bg-[#22306a] text-white',
}
const inputClass =
  'mt-1 w-full h-11 px-3 rounded-[10px] border border-[#d8dce8] bg-white text-base outline-none focus:border-[#2474b6] focus:ring-4 focus:ring-[#2474b6]/15'
const outlineBtn =
  'h-11 px-5 rounded-[10px] border-[1.5px] border-[#d8dce8] bg-white text-[#22306a] font-semibold hover:border-[#22306a] hover:bg-[#f5f6fa] transition-colors'

// Name shown in the list: "First Last", or the username when both are empty
const fullName = (u) => `${u.firstName} ${u.lastName}`.trim() || u.username
const initialsOf = (u) => (u.firstName ? u.firstName.slice(0, 2) : u.username.slice(0, 2)).toUpperCase()
// "2026-11-18 14:22:05" -> "Nov 18, 2026"
const joinedOn = (value) => {
  const d = new Date(String(value).replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function RoleBadge({ role }) {
  return <span className={`inline-block flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${ROLE_CLASS[role]}`}>{ROLE_LABEL[role]}</span>
}

// Photo, or initials when there is no photo (or it cannot be loaded). Never squeezed.
function Avatar({ user, size = 'w-10 h-10 text-base' }) {
  const [failed, setFailed] = useState(false)
  if (user.profileImage && !failed) {
    return (
      <img
        src={`/uploads/profile/${user.profileImage}`}
        alt="Profile"
        onError={() => setFailed(true)}
        className={`${size} flex-shrink-0 rounded-full object-cover bg-gray-100`}
      />
    )
  }
  return (
    <div className={`${size} flex-shrink-0 rounded-full flex items-center justify-center bg-gradient-to-br from-slate-400 to-slate-500 text-white font-bold`}>
      {initialsOf(user)}
    </div>
  )
}

// Edit (navy outline) and Delete (red trash icon, SuperAdmin only)
function UserActions({ user, canDelete, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        type="button"
        className="editUserBtn h-9 px-3.5 rounded-lg border-[1.5px] border-[#d8dce8] bg-white text-[#22306a] text-sm font-semibold hover:border-[#22306a] hover:bg-[#f5f6fa] transition-colors flex items-center gap-1.5"
        onClick={() => onEdit(user)}
      >
        <Edit3 className="w-4 h-4" /> Edit
      </button>
      {canDelete && (
        <button
          type="button"
          aria-label={`Delete ${fullName(user)}`}
          title="Delete"
          className="deleteUserBtn w-9 h-9 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center"
          onClick={() => onDelete(user)}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// Placeholders shown until the users arrive, shaped like a user card and a table row
const SKELETON_ROWS = [1, 2, 3, 4, 5, 6]

function UserActionsSkeleton({ canDelete }) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <Skeleton className="h-9 w-[4.5rem] !rounded-lg" />
      {canDelete && <Skeleton className="h-9 w-9 !rounded-lg" />}
    </div>
  )
}

function UserCardSkeleton({ canDelete }) {
  return (
    <li className="py-3.5 first:pt-1">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 flex-shrink-0 !rounded-full" />
        <div className="flex-1 min-w-0">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-3.5 w-48 max-w-full" />
        </div>
        <Skeleton className="h-5 w-16 flex-shrink-0" />
      </div>
      <div className="mt-2.5 sm:pl-[3.25rem] flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-28" />
        <UserActionsSkeleton canDelete={canDelete} />
      </div>
    </li>
  )
}

function UserRowSkeleton({ canDelete }) {
  return (
    <tr>
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 flex-shrink-0 !rounded-full" />
          <div className="flex-1 min-w-0"><Skeleton className="h-4 w-32 max-w-full" /><Skeleton className="mt-2 h-3 w-20" /></div>
        </div>
      </td>
      <td className="px-3 py-3"><Skeleton className="h-4 w-44 max-w-full" /></td>
      <td className="px-3 py-3"><Skeleton className="h-5 w-16" /></td>
      <td className="px-3 py-3"><Skeleton className="h-4 w-24" /></td>
      <td className="px-3 py-3"><div className="flex justify-end"><UserActionsSkeleton canDelete={canDelete} /></div></td>
    </tr>
  )
}

// The table's column headings (the loading placeholder table uses the same ones, so the columns do not shift)
function UsersTableHead() {
  return (
    <thead className="border-b border-gray-200">
      <tr>
        <th className="w-[30%] px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
        <th className="w-[32%] px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
        <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
        <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
        <th className="w-[9rem] px-3 py-3"><span className="sr-only">Actions</span></th>
      </tr>
    </thead>
  )
}

// "Edit User" popup. The role dropdown is only shown to SuperAdmins (same as the old page).
function EditUserModal({ user, canChangeRole, onClose, onSaved }) {
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    role: user.role,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  // Escape = Cancel and focus starts in First Name. A click outside does not close it, so a stray click
  // does not throw away what was typed.
  const box = useRef(null)
  useDialog(box, () => !saving && onClose())

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = await updateUser({ id: user.id, ...form, role: canChangeRole ? form.role : null })
      if (data.success) onSaved()
      else setError('Failed to update user: ' + (data.error || 'Unknown error'))
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div id="editUserModal" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#22306a]/30 backdrop-blur-[2px]">
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby="editUserTitle"
        tabIndex={-1}
        className="outline-none bg-white rounded-[18px] border border-[#eef0f5] shadow-[0_12px_40px_rgba(34,48,106,0.18)] p-5 sm:p-6 w-full max-w-lg max-h-[calc(100dvh-1.5rem)] overflow-y-auto"
      >
        <div className="flex items-center gap-3 mb-5">
          <Avatar user={user} size="w-11 h-11 text-base" />
          <div className="min-w-0">
            <h2 id="editUserTitle" className="text-xl font-bold text-[#22306a] leading-tight">Edit User</h2>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <form id="editUserForm" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="editFirstName" className="block text-sm font-semibold text-gray-700">First Name</label>
              <input type="text" id="editFirstName" required value={form.firstName} onChange={set('firstName')} className={inputClass} />
            </div>
            <div>
              <label htmlFor="editLastName" className="block text-sm font-semibold text-gray-700">Last Name</label>
              <input type="text" id="editLastName" required value={form.lastName} onChange={set('lastName')} className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="editUsername" className="block text-sm font-semibold text-gray-700">Username</label>
            <input type="text" id="editUsername" required value={form.username} onChange={set('username')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="editEmail" className="block text-sm font-semibold text-gray-700">Email</label>
            <input type="email" id="editEmail" required value={form.email} onChange={set('email')} className={inputClass} />
          </div>
          {canChangeRole && (
            <div>
              <label htmlFor="editRole" className="block text-sm font-semibold text-gray-700">Role</label>
              <select id="editRole" required value={form.role} onChange={set('role')} className={inputClass}>
                <option value="user">Customer</option>
                <option value="admin-1">Admin</option>
                <option value="admin-2">SuperAdmin</option>
              </select>
            </div>
          )}
          {error && <p id="editUserError" className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <button type="button" id="editUserCancel" onClick={onClose} className={outlineBtn}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="h-11 px-6 rounded-[10px] bg-[#22306a] hover:bg-[#1a2550] text-white font-semibold transition-colors disabled:opacity-60">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// "Delete User" confirmation
function DeleteUserModal({ user, onClose, onDeleted }) {
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Escape or a click outside = Cancel; focus starts on Cancel so Enter never deletes by accident
  const box = useRef(null)
  useDialog(box, () => !deleting && onClose())

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const data = await deleteUser(user.id)
      if (data.success) onDeleted()
      else setError('Failed to delete user. ' + (data.error || ''))
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      id="deleteUserModal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#22306a]/30 backdrop-blur-[2px]"
      onClick={(e) => e.target === e.currentTarget && !deleting && onClose()}
    >
      <div
        ref={box}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="deleteUserTitle"
        aria-describedby="deleteUserText"
        tabIndex={-1}
        className="outline-none bg-white rounded-[18px] border border-[#eef0f5] shadow-[0_12px_40px_rgba(34,48,106,0.18)] p-6 w-full max-w-md"
      >
        <h2 id="deleteUserTitle" className="text-xl font-bold text-gray-900 mb-2">Delete User</h2>
        <p id="deleteUserText" className="text-gray-600 mb-1">Are you sure you want to delete this account?</p>
        <p className="font-semibold text-gray-900 mb-6 break-words">{fullName(user)} · {user.email}</p>
        {error && <p id="deleteUserError" className="text-sm text-red-600 mb-4">{error}</p>}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button id="cancelDeleteUser" type="button" onClick={onClose} disabled={deleting} data-autofocus className={outlineBtn}>
            Cancel
          </button>
          <button id="confirmDeleteUser" type="button" onClick={handleDelete} disabled={deleting} className="h-11 px-5 rounded-[10px] bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-60">
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// Users (was admin-users.php).
export default function Users() {
  const { user: me, refresh } = useAuth()
  const [data, setData] = useState(null) // null until the first load is done
  const [reloading, setReloading] = useState(false) // getting the list again after an edit or delete
  const refreshing = useRefreshing(reloading)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  // Reload after an edit or delete (the first load is in the effect below)
  const load = useCallback(async () => {
    setReloading(true)
    try {
      setData(await getUsers())
      setLoadError('')
    } catch (error) {
      setLoadError(error.message)
    }
    setReloading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    getUsers()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loading = !data && !loadError
  const users = data?.users ?? []
  // Known from the sign-in straight away, so the placeholders already show the right buttons
  const isSuperAdmin = (data?.adminLevel ?? Number(me?.adminLevel)) >= 2
  const term = search.toLowerCase().trim()
  const visible = users.filter((u) => {
    const matchesSearch = fullName(u).toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
    const matchesRole = !roleFilter || ROLE_LABEL[u.role] === roleFilter
    return matchesSearch && matchesRole
  })

  const afterSave = async () => {
    const editedMyself = editing?.id === me?.id
    setEditing(null)
    await load()
    if (editedMyself) await refresh() // the top bar shows my new name
  }

  const ROLE_CHIPS = [
    { value: '', label: 'All roles' },
    { value: 'Customer', label: 'Customer' },
    { value: 'Admin', label: 'Admin' },
    { value: 'SuperAdmin', label: 'SuperAdmin' },
  ]

  return (
    <>
      {/* Title and subtitle: same sizes and spacing as the Overview, Orders and Inventory pages */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-[1.375rem] leading-tight sm:text-4xl font-bold text-gray-800 sm:mb-2" style={{ letterSpacing: '-0.01em' }}>Users</h1>
        <p className="text-gray-600 text-sm sm:text-lg">Manage and view all users and admins</p>
      </div>

      <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-lg border border-blue-100">
        {loadError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">{loadError}</div>}

        {/* Search with Clear beside it; the role chips share the line when there is room (they slide sideways on phones) */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3 mb-4 sm:mb-5">
          <div className="flex items-center gap-2 flex-1 basis-[14rem] sm:basis-[20rem] min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                id="userSearch"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-[10px] border border-[#d8dce8] bg-white text-base outline-none focus:border-[#2474b6] focus:ring-4 focus:ring-[#2474b6]/15"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setRoleFilter('')
              }}
              className="flex-shrink-0 h-10 px-3 rounded-[10px] text-[#22306a] font-semibold hover:bg-[#f5f6fa] transition-colors"
            >
              Clear
            </button>
          </div>
          <div id="roleFilter" className="flex gap-2 min-w-0 max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ROLE_CHIPS.map((c) => (
              <button
                key={c.value}
                type="button"
                data-role={c.value}
                onClick={() => setRoleFilter(c.value)}
                className={`flex-shrink-0 px-3.5 h-8 rounded-full border text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#2474b6]/40 ${
                  roleFilter === c.value ? 'bg-[#eef1f8] border-[#22306a] text-[#22306a] active' : 'bg-white border-gray-300 text-gray-700 hover:border-[#22306a]/50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <LoadingArea label="Loading users…">
            <ul className="users-cards divide-y divide-gray-100">
              {SKELETON_ROWS.map((n) => <UserCardSkeleton key={n} canDelete={isSuperAdmin} />)}
            </ul>
            <div className="users-table">
              <table className="w-full table-fixed text-sm text-left">
                <UsersTableHead />
                <tbody className="divide-y divide-gray-100">
                  {SKELETON_ROWS.map((n) => <UserRowSkeleton key={n} canDelete={isSuperAdmin} />)}
                </tbody>
              </table>
            </div>
          </LoadingArea>
        )}

        <div className={refreshingClass(refreshing)} aria-busy={refreshing || undefined}>
          {/* Narrower than 80em (1280px at normal text size): one card per user */}
          <ul id="usersCards" className="users-cards divide-y divide-gray-100">
            {visible.map((u) => (
              <li key={u.id} className="py-3.5 first:pt-1" data-user-card={u.id}>
                <div className="flex items-center gap-3">
                  <Avatar user={u} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{fullName(u)}</p>
                    <p className="text-sm text-gray-500 truncate">{u.email}</p>
                  </div>
                  <RoleBadge role={u.role} />
                </div>
                <div className="mt-2.5 sm:pl-[3.25rem] flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <span className="text-sm text-gray-500 whitespace-nowrap">Joined {joinedOn(u.createdAt)}</span>
                  <UserActions user={u} canDelete={isSuperAdmin} onEdit={setEditing} onDelete={setDeleting} />
                </div>
              </li>
            ))}
          </ul>

          {/* 80em and wider: the table */}
          <div className="users-table">
            <table className="w-full table-fixed text-sm text-left">
              <UsersTableHead />
              <tbody id="usersTableBody" className="divide-y divide-gray-100">
                {visible.map((u) => (
                  <tr key={u.id}>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar user={u} />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate" title={fullName(u)}>{fullName(u)}</p>
                          <p className="text-xs text-gray-500 truncate">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700"><p className="truncate" title={u.email}>{u.email}</p></td>
                    <td className="px-3 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{joinedOn(u.createdAt)}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end">
                        <UserActions user={u} canDelete={isSuperAdmin} onEdit={setEditing} onDelete={setDeleting} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {users.length > 0 && visible.length === 0 && (
          <div id="noResultsMsg" className="py-10 text-center text-gray-500">
            <div className="flex flex-col items-center gap-2">
              <SearchX className="w-8 h-8 text-gray-400" />
              <span className="text-lg font-medium">No users found</span>
              <span className="text-sm">Try adjusting your search or filter criteria</span>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <EditUserModal user={editing} canChangeRole={isSuperAdmin} onClose={() => setEditing(null)} onSaved={afterSave} />
      )}
      {deleting && (
        <DeleteUserModal
          user={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={async () => {
            setDeleting(null)
            await load()
          }}
        />
      )}
    </>
  )
}
