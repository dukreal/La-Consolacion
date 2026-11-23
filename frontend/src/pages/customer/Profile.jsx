import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SavedAddressCard from '../../components/delivery/SavedAddressCard'
import OrderHistoryList from '../../components/orders/OrderHistoryList'
import { useAuth } from '../../hooks/useAuth'
import { getProfile, updateProfile } from '../../services/profileService'
import '../../styles/profile.css'

const EMPTY = { firstName: '', lastName: '', username: '', email: '', mobileNumber: '' }

// The sections of the page. ?tab=address and ?tab=orders open those directly (the header's "Order History" link
// uses ?tab=orders). `short` is the phone tab's label.
const SECTIONS = [
  { id: 'info', label: 'Personal info', short: 'Profile', icon: 'bx-user', hint: 'Your name, contact details and photo' },
  { id: 'address', label: 'Delivery address', short: 'Address', icon: 'bx-package', hint: 'Used when you choose delivery by courier at checkout' },
  { id: 'orders', label: 'Order history', short: 'Orders', icon: 'bx-receipt', hint: 'Your orders and where they are' },
]

// Photo shown in the circle: the saved photo, or an avatar made from the first two letters
// of the first name (same ui-avatars.com service as the old page).
function savedPhotoUrl(profile) {
  if (profile.profileImage) return `/uploads/profile/${profile.profileImage}`
  const initials = (profile.firstName || '').slice(0, 2).toUpperCase()
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=2474b6&color=fff`
}

function Field({ icon, label, htmlFor, className = '', children }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-gray-800 font-semibold mb-1 text-sm flex items-center gap-2">
        <i className={`bx ${icon} text-base`} style={{ color: '#2474b6' }} aria-hidden="true"></i>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputClass = 'input-field w-full px-4 py-2.5 lg:py-2 rounded-xl text-base shadow-sm'

// My Account (was profile.php): Personal info, Delivery address and Order history, one at a time.
// The page is exactly one screen tall on every device and never scrolls itself: the title, the photo and the menu
// stay put, and only the section's content scrolls (a long order history, or a form on a small phone).
// Desktop (lg): a sidebar with the photo, name and menu on the left, the chosen section on the right.
// Phones and tablets: the name and three tabs on top, the section under them; the Save button stays at the bottom.
export default function Profile() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [params, setParams] = useSearchParams()
  const section = SECTIONS.some((s) => s.id === params.get('tab')) ? params.get('tab') : 'info'
  const current = SECTIONS.find((s) => s.id === section)

  const [form, setForm] = useState(EMPTY)
  const [saved, setSaved] = useState(null) // the profile as it is stored on the server
  const [loadError, setLoadError] = useState('')
  const [photo, setPhoto] = useState(null) // a new photo, not saved yet
  const [errors, setErrors] = useState([])
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [checkedMobile, setCheckedMobile] = useState(false) // the warning only appears after pressing Save
  const [avatarFailed, setAvatarFailed] = useState(false) // the photo or avatar could not be loaded
  const fileRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    getProfile()
      .then((user) => {
        if (cancelled) return
        setSaved(user)
        setForm({ ...EMPTY, ...user, mobileNumber: user.mobileNumber || '' })
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Preview of a newly chosen photo (freed again when it changes)
  const previewUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : ''), [photo])
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  // Digits only, at most 11 (the old page blocked other keys)
  const setMobile = (e) => setForm({ ...form, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 11) })

  const mobile = form.mobileNumber
  const mobileInvalid = mobile.length > 0 && mobile.length !== 11
  const mobileClass = !checkedMobile ? '' : mobileInvalid ? ' border-red-500' : mobile.length === 11 ? ' border-green-500' : ''

  // Back arrow: the previous page, or Home when the profile was opened directly
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'))

  const openSection = (id) => {
    setSuccess(false)
    setErrors([])
    setParams(id === 'info' ? {} : { tab: id }, { replace: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCheckedMobile(true)
    if (mobileInvalid) {
      document.getElementById('profileMobile')?.focus()
      return
    }
    setSaving(true)
    setErrors([])
    setSuccess(false)
    try {
      const data = await updateProfile({ ...form, photo })
      if (data.success) {
        setSaved((before) => ({ ...before, ...data.user })) // keeps the saved address
        setAvatarFailed(false) // try the (new) picture again
        setForm({ ...EMPTY, ...data.user, mobileNumber: data.user.mobileNumber || '' })
        setPhoto(null)
        if (fileRef.current) fileRef.current.value = ''
        setSuccess(true)
        await refresh() // the header shows the new name and photo
      } else {
        setErrors(data.errors || ['Failed to update profile.'])
      }
    } catch {
      setErrors(['Could not reach the server. Please try again.'])
    } finally {
      setSaving(false)
    }
  }

  const fullName = saved ? `${saved.firstName || ''} ${saved.lastName || ''}`.trim() : ''

  // The round photo (or the initials when it cannot load)
  const avatar = (size) =>
    avatarFailed && !previewUrl ? (
      <div
        id="avatarFallback"
        className={`${size} flex-shrink-0 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold`}
        style={{ background: '#2474b6' }}
      >
        {(saved?.firstName || '').slice(0, 2).toUpperCase()}
      </div>
    ) : (
      <img
        src={previewUrl || savedPhotoUrl(saved)}
        alt="Profile picture"
        onError={() => setAvatarFailed(true)}
        className={`${size} flex-shrink-0 rounded-full object-cover border-4 border-white shadow-lg`}
      />
    )

  return (
    <div className="profile-page h-dvh overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto w-full max-w-5xl h-full flex flex-col px-4 sm:px-6 pt-4 pb-3 sm:py-5 xl:py-8">
        {/* Back button and title */}
        <div className="flex-shrink-0 flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 xl:mb-6">
          <button
            type="button"
            onClick={goBack}
            aria-label="Back"
            className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 rounded-xl bg-white text-gray-700 shadow-sm transition-colors [@media(hover:hover)]:hover:bg-gray-100"
          >
            <i className="bx bx-arrow-back text-xl" aria-hidden="true"></i>
          </button>
          <div className="min-w-0">
            <h1 className="font-['Playfair_Display',serif] text-2xl sm:text-[1.9rem] font-bold text-[#22306a] leading-tight">My Account</h1>
            <p className="text-gray-600 text-sm">Manage your profile and delivery address</p>
          </div>
        </div>

        {loadError && (
          <div id="profileErrors" role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {loadError}
          </div>
        )}

        {saved && (
          <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-6 lg:items-start">
            {/* Sidebar (desktop) / name and tabs (phones and tablets) */}
            <aside className="flex-shrink-0 profile-card rounded-2xl shadow-lg p-3 sm:p-4 lg:px-4 lg:py-6 mb-3 sm:mb-4 lg:mb-0 lg:max-h-full lg:overflow-y-auto">
              <div className="flex lg:flex-col items-center gap-3 lg:gap-2 lg:pb-5 lg:mb-4 lg:border-b lg:border-gray-100">
                <div className="profile-image-container">{avatar('w-14 h-14 lg:w-24 lg:h-24 text-lg lg:text-3xl')}</div>
                <div className="min-w-0 lg:text-center">
                  <p className="font-bold text-gray-800 leading-snug break-words line-clamp-2">{fullName}</p>
                  {saved.username && <p className="text-sm text-gray-500 truncate">@{saved.username}</p>}
                </div>
              </div>

              <nav aria-label="Account" className="mt-4 lg:mt-0">
                <ul className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#e9edf5] lg:bg-transparent lg:p-0 lg:grid-cols-1 lg:gap-1.5">
                  {SECTIONS.map((s) => {
                    const active = s.id === section
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          id={`section-${s.id}`}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => openSection(s.id)}
                          className={`profile-nav w-full min-h-11 flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3.5 rounded-lg lg:rounded-xl text-sm lg:text-[15px] transition-colors ${
                            active ? 'bg-[#22306a] text-white font-semibold' : 'text-gray-700 font-medium [@media(hover:hover)]:hover:bg-white lg:[@media(hover:hover)]:hover:bg-[#f1f4f9]'
                          }`}
                        >
                          <i className={`bx ${s.icon} text-xl hidden lg:inline`} aria-hidden="true"></i>
                          {/* Phones and tablets: the short label, so three tabs fit side by side */}
                          <span className="whitespace-nowrap lg:hidden">{s.short}</span>
                          <span className="whitespace-nowrap hidden lg:inline">{s.label}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            </aside>

            {/* The chosen section */}
            <section aria-labelledby="sectionTitle" className="flex-1 min-h-0 lg:flex-none lg:max-h-full flex flex-col profile-card rounded-2xl shadow-lg">
              <div className="flex-shrink-0 flex flex-wrap items-start justify-between gap-3 px-5 sm:px-7 lg:px-6 xl:px-7 pt-5 sm:pt-7 lg:pt-6 xl:pt-7 pb-4">
                <div className="min-w-0">
                  <h2 id="sectionTitle" className="text-lg sm:text-xl font-bold text-[#22306a]">
                    {current.label}
                  </h2>
                  <p className="text-gray-600 text-sm mt-0.5">{current.hint}</p>
                </div>
                {section === 'info' && (
                  <label className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-xl border border-[#d8dce8] bg-white text-[#22306a] text-sm font-semibold cursor-pointer transition-colors [@media(hover:hover)]:hover:border-[#22306a] focus-within:ring-2 focus-within:ring-[#2474b6]/40">
                    <i className="bx bx-camera text-lg" aria-hidden="true"></i>
                    Change photo
                    <input
                      ref={fileRef}
                      type="file"
                      name="profile_image"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                    />
                  </label>
                )}
              </div>

              {/* The part under the title scrolls when it does not fit (the page itself never scrolls) */}
              <div id="sectionBody" className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-7 lg:px-6 xl:px-7 pb-5 sm:pb-7 lg:pb-6 xl:pb-7">
              {section === 'info' ? (
                <form id="profileForm" onSubmit={handleSubmit} noValidate>
                  {errors.length > 0 && (
                    <div id="profileErrors" role="alert" className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                      {errors.map((message) => (
                        <p key={message}>{message}</p>
                      ))}
                    </div>
                  )}
                  {success && (
                    <div id="profileSuccess" role="status" className="mb-5 p-3.5 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
                      Your profile has been updated successfully.
                    </div>
                  )}
                  {photo && <p className="mb-4 text-sm text-gray-600">New photo selected. Press Save Changes to keep it.</p>}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 lg:gap-y-3">
                    <Field icon="bx-user" label="First Name" htmlFor="profileFirstName">
                      <input id="profileFirstName" type="text" name="first_name" autoComplete="given-name" value={form.firstName} onChange={set('firstName')} className={inputClass} required />
                    </Field>
                    <Field icon="bx-user" label="Last Name" htmlFor="profileLastName">
                      <input id="profileLastName" type="text" name="last_name" autoComplete="family-name" value={form.lastName} onChange={set('lastName')} className={inputClass} required />
                    </Field>
                    <Field icon="bx-at" label="Username" htmlFor="profileUsername">
                      <input id="profileUsername" type="text" name="username" autoComplete="username" value={form.username} onChange={set('username')} className={inputClass} required />
                    </Field>
                    <Field icon="bx-phone" label="Mobile Number" htmlFor="profileMobile">
                      <input
                        id="profileMobile"
                        type="tel"
                        name="mobile_number"
                        inputMode="numeric"
                        autoComplete="tel"
                        value={mobile}
                        onChange={setMobile}
                        className={inputClass + mobileClass}
                        maxLength={11}
                        placeholder="09XXXXXXXXX"
                        aria-invalid={checkedMobile && mobileInvalid ? true : undefined}
                        aria-describedby={checkedMobile && mobileInvalid ? 'mobileNumberWarning' : undefined}
                      />
                      {checkedMobile && mobileInvalid && (
                        <p id="mobileNumberWarning" className="mt-1.5 text-red-600 text-xs">
                          Mobile number must be exactly 11 digits (e.g., 09123456789)
                        </p>
                      )}
                    </Field>
                    <Field icon="bx-envelope" label="Email Address" htmlFor="profileEmail" className="sm:col-span-2">
                      <input id="profileEmail" type="email" name="email" autoComplete="email" value={form.email} onChange={set('email')} className={inputClass} required />
                    </Field>
                  </div>

                  {/* At the end of the card, and still in view when the form scrolls inside it (small phones, short screens,
                      larger text). A fixed bar would not work inside the card's frosted-glass background. */}
                  <div className="profile-savebar sticky bottom-0 z-20 -mx-5 sm:-mx-7 lg:-mx-6 xl:-mx-7 mt-5 px-5 sm:px-7 lg:px-6 xl:px-7 py-3 lg:pt-3 lg:pb-0 bg-white/95 border-t border-gray-100 lg:border-0 rounded-b-2xl lg:rounded-none flex lg:justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary w-full lg:w-auto min-h-12 justify-center inline-flex items-center gap-2 px-8 text-white font-bold text-base rounded-xl shadow-lg"
                    >
                      <i className="bx bx-save text-lg" aria-hidden="true"></i>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : section === 'orders' ? (
                <OrderHistoryList />
              ) : (
                <SavedAddressCard
                  initial={saved.address}
                  onSaved={(address) => setSaved((before) => ({ ...before, address }))}
                  defaults={{ name: fullName, mobile: saved.mobileNumber || '' }}
                />
              )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
