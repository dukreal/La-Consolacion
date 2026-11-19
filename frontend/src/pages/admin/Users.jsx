import { Edit3, Search, SearchX, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { deleteUser, getUsers, updateUser } from '../../services/adminService'

const ROLE_LABEL = { user: 'Customer', 'admin-1': 'Admin', 'admin-2': 'SuperAdmin' }
const ROLE_CLASS = {
  user: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
  'admin-1': 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
  'admin-2': 'bg-gradient-to-r from-red-600 to-red-800 text-white',
}
const inputClass = 'mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none'

// Name shown in the table: "First Last", or the username when both are empty
const fullName = (u) => `${u.firstName} ${u.lastName}`.trim() || u.username
const initialsOf = (u) => (u.firstName ? u.firstName.slice(0, 2) : u.username.slice(0, 2)).toUpperCase()

// Photo, or initials when there is no photo (or it cannot be loaded)
function Avatar({ user }) {
  const [failed, setFailed] = useState(false)
  if (user.profileImage && !failed) {
    return (
      <img
        src={`/uploads/profile/${user.profileImage}`}
        alt="Profile"
        onError={() => setFailed(true)}
        className="w-10 h-10 rounded-full object-cover bg-gray-100"
      />
    )
  }
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-slate-400 to-slate-500 text-white font-bold text-lg">
      {initialsOf(user)}
    </div>
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
    <div id="editUserModal" className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">Edit User</h2>
        <form id="editUserForm" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="editFirstName" className="block text-sm font-medium text-gray-700">First Name</label>
            <input type="text" id="editFirstName" required value={form.firstName} onChange={set('firstName')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="editLastName" className="block text-sm font-medium text-gray-700">Last Name</label>
            <input type="text" id="editLastName" required value={form.lastName} onChange={set('lastName')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="editUsername" className="block text-sm font-medium text-gray-700">Username</label>
            <input type="text" id="editUsername" required value={form.username} onChange={set('username')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="editEmail" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" id="editEmail" required value={form.email} onChange={set('email')} className={inputClass} />
          </div>
          {canChangeRole && (
            <div>
              <label htmlFor="editRole" className="block text-sm font-medium text-gray-700">Role</label>
              <select id="editRole" required value={form.role} onChange={set('role')} className={inputClass}>
                <option value="user">Customer</option>
                <option value="admin-1">Admin</option>
                <option value="admin-2">SuperAdmin</option>
              </select>
            </div>
          )}
          {error && <p id="editUserError" className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 mt-6">
            <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              Save
            </button>
            <button type="button" id="editUserCancel" onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
              Cancel
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
    <div id="deleteUserModal" className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">Delete User</h2>
        <p className="mb-6">Are you sure you want to delete this account?</p>
        {error && <p id="deleteUserError" className="text-sm text-red-600 mb-4">{error}</p>}
        <div className="flex justify-end gap-2">
          <button id="confirmDeleteUser" onClick={handleDelete} disabled={deleting} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-60">
            Yes, Delete
          </button>
          <button id="cancelDeleteUser" onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// Users (was admin-users.php).
export default function Users() {
  const { user: me, refresh } = useAuth()
  const [data, setData] = useState({ users: [], adminLevel: 1, currentUserId: null })
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    try {
      setData(await getUsers())
      setLoadError('')
    } catch (error) {
      setLoadError(error.message)
    }
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

  const isSuperAdmin = data.adminLevel >= 2
  const term = search.toLowerCase().trim()
  const visible = data.users.filter((u) => {
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

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Users</h1>
        <p className="text-gray-600 text-lg">Manage and view all users and admins</p>
      </div>

      <div className="glass p-6 rounded-2xl mb-8 shadow-lg">
        {loadError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">{loadError}</div>}

        {/* Search and Filter */}
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              id="userSearch"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <div>
            <select
              id="roleFilter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            >
              <option value="">All Roles</option>
              <option value="Customer">Customer</option>
              <option value="Admin">Admin</option>
              <option value="SuperAdmin">SuperAdmin</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setRoleFilter('')
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors ml-1"
            >
              Clear
            </button>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left rounded-2xl overflow-hidden shadow border border-blue-100">
            <thead className="bg-blue-50 border-b border-blue-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody id="usersTableBody" className="bg-white divide-y divide-blue-50">
              {visible.map((u) => (
                <tr key={u.id} className="hover:bg-blue-50 transition-all duration-200">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div className="flex items-center gap-3">
                      <Avatar user={u} />
                      <span>{fullName(u)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{u.email}</td>
                  <td className="px-6 py-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${ROLE_CLASS[u.role]} shadow-sm mx-auto`}>
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{u.createdAt}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="editUserBtn bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold text-xs hover:bg-blue-200 transition flex items-center gap-1"
                        onClick={() => setEditing(u)}
                      >
                        <Edit3 className="w-4 h-4" /> Edit
                      </button>
                      {isSuperAdmin && (
                        <button
                          className="deleteUserBtn bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold text-xs hover:bg-red-200 transition flex items-center gap-1"
                          onClick={() => setDeleting(u)}
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {data.users.length > 0 && visible.length === 0 && (
                <tr id="noResultsMsg">
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <SearchX className="w-8 h-8 text-gray-400" />
                      <span className="text-lg font-medium">No users found</span>
                      <span className="text-sm">Try adjusting your search or filter criteria</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
