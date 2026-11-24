import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import SavedAddressCard from '../../components/delivery/SavedAddressCard'
import OrderHistoryList from '../../components/orders/OrderHistoryList'
import { useAuth } from '../../hooks/useAuth'
import { getProfile, updateProfile } from '../../services/profileService'
import '../../styles/profile.css'

const EMPTY = { firstName: '', lastName: '', username: '', email: '', mobileNumber: '' }

// The sections of the page. ?tab=info, ?tab=address and ?tab=orders open one directly (the header's "Order History"
// link uses ?tab=orders). Without ?tab, desktop shows Personal info and phones show the menu.
const SECTIONS = [
  { id: 'info', label: 'Personal info', icon: 'bx-user', hint: 'Your name, contact details and photo' },
  { id: 'address', label: 'Delivery address', icon: 'bx-package', hint: 'Used when you choose delivery by courier at checkout' },
  { id: 'orders', label: 'Order history', icon: 'bx-receipt', hint: 'Your orders and where they are' },
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
// The page is exactly one screen tall on every device and never scrolls itself: only the section's content scrolls
// (a long order history, or a form on a small phone).
// Desktop (lg): a sidebar with the photo, name and menu on the left, the chosen section on the right.
// Phones and tablets: like a phone's settings, a menu first (photo, name and three rows); a row opens that section on
// its own screen with a back arrow, and the phone's back gesture also returns to the menu. Save stays at the bottom.
export default function Profile() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const chosen = SECTIONS.some((s) => s.id === params.get('tab')) ? params.get('tab') : null
  const section = chosen || 'info'
  const current = SECTIONS.find((s) => s.id === section)
  const onMenu = !chosen // phones and tablets show the menu (desktop shows Personal info)

  const [form, setForm] = useState(EMPTY)
  const [saved, setSaved] = useState(null) // the profile as it is stored on the server
  const [loadError, setLoadError] = useState('')
  const [photo, setPhoto] = useState(null) // a new photo, not saved yet
  const [errors, setErrors] = useState([])
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [checkedMobile, setCheckedMobile] = useState(false) // the warning only appears after pressing Save
  const [avatarFailed, setAvatarFailed] = useState(false) // the photo or avatar could not be loaded

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

  // Desktop sidebar: swaps the section in place
  const openSection = (id) => {
    setSuccess(false)
    setErrors([])
    setParams(id === 'info' ? {} : { tab: id }, { replace: true })
  }

  // Phone menu: opens the section as a new screen, so the phone's back gesture returns to the menu
  const openFromMenu = (id) => {
    setSuccess(false)
    setErrors([])
    navigate({ search: `?tab=${id}` }, { state: { fromMenu: true } })
  }

  // The section's back arrow (phones): to the menu. A section opened straight from a link has no menu behind it.
  const backToMenu = () => (location.state?.fromMenu ? navigate(-1) : navigate('/profile', { replace: true }))

  // A new photo (shown at once, saved with Save Changes). The input is emptied so the same picture can be chosen again.
  const pickPhoto = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhoto(file)
    setSuccess(false)
    return file
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

  // The second line of each row in the phone menu
  const preview = {
    info: 'Name, mobile number, email and photo',
    address: saved?.address?.street ? `${saved.address.street}, ${saved.address.city}` : 'No address saved yet',
    orders: 'Your orders and where they are',
  }

  // "Change photo": a button-looking label around a hidden file input
  const photoInput = (onChange = pickPhoto) => (
    <input type="file" name="profile_image" accept="image/*" className="sr-only" onChange={onChange} />
  )

  // The round photo (or the initials when it cannot load)
  const avatar = (size) =>
    avatarFailed && !previewUrl ? (
      <div
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
    <div className="profile-page h-dvh overflow-hidden bg-white lg:bg-gradient-to-br lg:from-slate-50 lg:via-blue-50 lg:to-indigo-100">
      <div className="mx-auto w-full max-w-2xl lg:max-w-5xl h-full flex flex-col lg:px-6 lg:py-5 xl:py-8">
        {/* Back button and title (phones: on the menu only, each section has its own title bar) */}
        <div className={`${onMenu ? 'flex' : 'hidden'} lg:flex flex-shrink-0 items-center gap-1 lg:gap-4 px-2 sm:px-4 lg:px-0 pt-1 lg:pt-0 lg:mb-4 xl:mb-6`}>
          <button
            type="button"
            onClick={goBack}
            aria-label="Back"
            className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 rounded-xl text-[#22306a] lg:text-gray-700 lg:bg-white lg:shadow-sm transition-colors [@media(hover:hover)]:hover:bg-gray-100"
          >
            <i className="bx bx-arrow-back text-xl" aria-hidden="true"></i>
          </button>
          <div className="min-w-0">
            <h1 className="font-['Playfair_Display',serif] text-[1.35rem] lg:text-[1.9rem] font-bold text-[#22306a] leading-tight">My Account</h1>
            <p className="hidden lg:block text-gray-600 text-sm">Manage your profile and delivery address</p>
          </div>
        </div>

        {loadError && (
          <div id="profileErrors" role="alert" className="mx-4 lg:mx-0 my-4 lg:mt-0 lg:mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {loadError}
          </div>
        )}

        {saved && (
          <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-6 lg:items-start">
            {/* Sidebar (desktop) / the menu (phones and tablets) */}
            <aside
              className={`${onMenu ? 'block' : 'hidden'} lg:block flex-1 min-h-0 overflow-y-auto overscroll-contain lg:flex-none profile-card lg:rounded-2xl lg:shadow-lg lg:px-4 lg:py-6 lg:max-h-full`}
            >
              <div className="flex flex-col items-center text-center gap-2 px-5 pt-5 pb-7 border-b-8 border-[#f4f6fa] lg:px-0 lg:pt-0 lg:pb-5 lg:mb-4 lg:border-b lg:border-gray-100">
                <div className="profile-image-container">
                  {avatar('w-24 h-24 text-3xl')}
                  {/* Phones: change the photo from the menu; Personal info opens to save it */}
                  <label className="lg:hidden absolute -right-1 -bottom-1 w-10 h-10 rounded-full border-2 border-white bg-[#22306a] text-white flex items-center justify-center cursor-pointer transition-colors [@media(hover:hover)]:hover:bg-[#1a2550] focus-within:ring-2 focus-within:ring-[#2474b6]/50">
                    <i className="bx bx-camera text-lg" aria-hidden="true"></i>
                    <span className="sr-only">Change photo</span>
                    {photoInput((e) => pickPhoto(e) && openFromMenu('info'))}
                  </label>
                </div>
                <div className="min-w-0 max-w-full">
                  <p className="font-bold text-gray-800 text-lg lg:text-base leading-snug lg:leading-snug break-words line-clamp-2">{fullName}</p>
                  {saved.username && <p className="text-sm text-gray-500 truncate">@{saved.username}</p>}
                </div>
              </div>

              {/* Phones and tablets: one row per section */}
              <nav aria-label="Account" className="lg:hidden">
                <ul>
                  {SECTIONS.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        id={`menu-${s.id}`}
                        onClick={() => openFromMenu(s.id)}
                        className="w-full min-h-16 flex items-center gap-3.5 px-5 py-3 text-left border-b border-gray-100 transition-colors [@media(hover:hover)]:hover:bg-[#f7f8fb]"
                      >
                        <span className="w-10 h-10 flex-shrink-0 rounded-xl bg-[#eef3fb] text-[#22306a] flex items-center justify-center">
                          <i className={`bx ${s.icon} text-xl`} aria-hidden="true"></i>
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-semibold text-gray-800 text-[15px]">{s.label}</span>
                          <span className="block text-xs text-gray-500 mt-0.5 break-words">{preview[s.id]}</span>
                        </span>
                        <i className="bx bx-chevron-right text-2xl text-gray-400 flex-shrink-0" aria-hidden="true"></i>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Desktop: the sidebar menu */}
              <nav aria-label="Account" className="hidden lg:block">
                <ul className="grid grid-cols-1 gap-1.5">
                  {SECTIONS.map((s) => {
                    const active = s.id === section
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          id={`section-${s.id}`}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => openSection(s.id)}
                          className={`profile-nav w-full min-h-11 flex items-center justify-start gap-3 px-3.5 rounded-xl text-[15px] transition-colors ${
                            active ? 'bg-[#22306a] text-white font-semibold' : 'text-gray-700 font-medium [@media(hover:hover)]:hover:bg-[#f1f4f9]'
                          }`}
                        >
                          <i className={`bx ${s.icon} text-xl`} aria-hidden="true"></i>
                          <span className="whitespace-nowrap">{s.label}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            </aside>

            {/* The chosen section (phones: its own screen) */}
            <section
              aria-labelledby="sectionTitle"
              className={`${onMenu ? 'hidden' : 'flex'} lg:flex flex-1 min-h-0 lg:flex-none lg:max-h-full flex-col profile-card lg:rounded-2xl lg:shadow-lg ${
                section === 'orders' ? 'bg-[#f4f6fa]' : ''
              }`}
            >
              {/* Phones: a title bar with a back arrow to the menu. Desktop: the title and hint. */}
              <div className="flex-shrink-0 flex items-center lg:flex-wrap lg:items-start lg:justify-between gap-1 lg:gap-3 px-2 sm:px-4 py-1.5 lg:px-6 xl:px-7 lg:pt-6 xl:pt-7 lg:pb-4 bg-white lg:bg-transparent border-b border-gray-100 lg:border-0">
                <button
                  type="button"
                  onClick={backToMenu}
                  aria-label="Back to My Account"
                  className="lg:hidden inline-flex items-center justify-center w-11 h-11 flex-shrink-0 rounded-xl text-[#22306a] transition-colors [@media(hover:hover)]:hover:bg-gray-100"
                >
                  <i className="bx bx-arrow-back text-xl" aria-hidden="true"></i>
                </button>
                <div className="min-w-0">
                  <h2 id="sectionTitle" className="text-[17px] lg:text-xl font-bold text-[#22306a]">
                    {current.label}
                  </h2>
                  <p className="hidden lg:block text-gray-600 text-sm mt-0.5">{current.hint}</p>
                </div>
                {section === 'info' && (
                  <label className="hidden lg:inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-xl border border-[#d8dce8] bg-white text-[#22306a] text-sm font-semibold cursor-pointer transition-colors [@media(hover:hover)]:hover:border-[#22306a] focus-within:ring-2 focus-within:ring-[#2474b6]/40">
                    <i className="bx bx-camera text-lg" aria-hidden="true"></i>
                    Change photo
                    {photoInput()}
                  </label>
                )}
              </div>

              {/* The part under the title scrolls when it does not fit (the page itself never scrolls) */}
              <div
                id="sectionBody"
                className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-7 lg:px-6 xl:px-7 pt-4 lg:pt-0 ${section === 'orders' ? 'pb-5' : 'pb-0'} lg:pb-6 xl:pb-7`}
              >
              {section === 'info' ? (
                <form id="profileForm" onSubmit={handleSubmit} noValidate className="min-h-full flex flex-col lg:block lg:min-h-0">
                  {/* Phones: the photo and its button at the top of the form */}
                  <div className="lg:hidden flex items-center gap-4 mb-5">
                    <div className="profile-image-container">{avatar('w-16 h-16 text-xl')}</div>
                    <label className="inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-xl border border-[#d8dce8] bg-white text-[#22306a] text-sm font-semibold cursor-pointer transition-colors [@media(hover:hover)]:hover:border-[#22306a] focus-within:ring-2 focus-within:ring-[#2474b6]/40">
                      <i className="bx bx-camera text-lg" aria-hidden="true"></i>
                      Change photo
                      {photoInput()}
                    </label>
                  </div>

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

                  {/* At the bottom of the screen on phones, at the end of the card on desktop; still in view when the form
                      scrolls (small phones, short screens, larger text). A fixed bar would not work inside the card's
                      frosted-glass background. */}
                  <div className="flex-1 min-h-6 lg:hidden" aria-hidden="true"></div>
                  <div className="profile-savebar sticky bottom-0 z-20 -mx-5 sm:-mx-7 lg:-mx-6 xl:-mx-7 lg:mt-5 px-5 sm:px-7 lg:px-6 xl:px-7 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:pb-0 bg-white lg:bg-white/95 border-t border-gray-100 lg:border-0 flex lg:justify-end">
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
