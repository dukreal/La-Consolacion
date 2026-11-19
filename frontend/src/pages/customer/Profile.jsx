import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getProfile, updateProfile } from '../../services/profileService'
import '../../styles/profile.css'

const EMPTY = { firstName: '', lastName: '', username: '', email: '', mobileNumber: '' }

// Photo shown in the circle: the saved photo, or an avatar made from the first two letters
// of the first name (same ui-avatars.com service as the old page).
function savedPhotoUrl(profile) {
  if (profile.profileImage) return `/uploads/profile/${profile.profileImage}`
  const initials = (profile.firstName || '').slice(0, 2).toUpperCase()
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=2474b6&color=fff`
}

// One labelled input. `index` staggers the fade-in, like the old page.
function Field({ index, icon, label, children }) {
  return (
    <div className="form-group" style={{ animationDelay: `${index * 100}ms` }}>
      <label className="block text-gray-800 font-semibold mb-2 text-base flex items-center gap-2">
        <i className={`bx ${icon} text-lg`} style={{ color: '#2474b6' }}></i>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputClass = 'input-field w-full px-4 py-3 rounded-xl text-base shadow-sm transition-all duration-300'

// Profile Settings (was profile.php).
export default function Profile() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCheckedMobile(true)
    if (mobileInvalid) {
      document.querySelector('input[name="mobile_number"]')?.focus()
      return
    }
    setSaving(true)
    setErrors([])
    setSuccess(false)
    try {
      const data = await updateProfile({ ...form, photo })
      if (data.success) {
        setSaved(data.user)
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
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="profile-page min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* The card sits in the middle of the screen when it fits; taller cards just scroll. (A shared .container rule sets a column layout, so justify-center does the vertical centering.) */}
      <div className="container mx-auto min-h-screen flex flex-col justify-center px-4 py-6 sm:py-10 lg:py-8">
        <div className="w-full max-w-3xl lg:max-w-4xl mx-auto">
          <div className="profile-card rounded-2xl shadow-xl p-5 sm:p-8">
            {/* Back button, title */}
            <div className="flex justify-between items-start mb-6 pb-5 border-b border-gray-100">
              <button
                type="button"
                onClick={goBack}
                aria-label="Back"
                className="inline-flex items-center justify-center w-10 h-10 flex-shrink-0 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <i className="bx bx-arrow-back text-xl"></i>
              </button>
              <div className="text-center flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Profile Settings</h1>
                <p className="text-gray-600 text-sm">Manage your account information</p>
              </div>
              <div className="w-10"></div>
            </div>

            {/* Error / success messages */}
            {(errors.length > 0 || loadError) && (
              <div id="profileErrors" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <i className="bx bx-error-circle text-xl text-red-500"></i>
                  <h3 className="text-base font-semibold text-red-800">Please fix the following errors:</h3>
                </div>
                <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                  {(loadError ? [loadError] : errors).map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
            )}
            {success && (
              <div id="profileSuccess" className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <i className="bx bx-check-circle text-xl text-green-500"></i>
                  <div>
                    <h3 className="text-base font-semibold text-green-800">Success!</h3>
                    <p className="text-green-700 text-sm">Your profile has been updated successfully.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Phones and tablets: photo on top, fields below. Desktop: photo on the left, fields on the right,
                so the whole page fits a laptop screen (browser tabs and 125% scaling) without scrolling. */}
            {saved && (
              <form
                onSubmit={handleSubmit}
                className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[240px_1fr] lg:gap-x-8 lg:gap-y-6"
                noValidate
              >
                {/* Profile photo */}
                <div className="flex flex-col items-center gap-3 mb-2 lg:mb-0 lg:row-span-2 lg:self-center lg:pr-8 lg:border-r lg:border-gray-100 lg:h-full lg:justify-center">
                  <div className="profile-image-container">
                    {avatarFailed && !previewUrl ? (
                      // The avatar could not load (offline, or ui-avatars.com is down): draw the initials ourselves
                      <div
                        id="avatarFallback"
                        className="w-24 h-24 sm:w-28 sm:h-28 lg:w-36 lg:h-36 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white text-3xl sm:text-4xl lg:text-5xl font-semibold"
                        style={{ background: '#2474b6' }}
                      >
                        {(saved.firstName || '').slice(0, 2).toUpperCase()}
                      </div>
                    ) : (
                      <img
                        src={previewUrl || savedPhotoUrl(saved)}
                        alt="Profile Picture"
                        onError={() => setAvatarFailed(true)}
                        className="w-24 h-24 sm:w-28 sm:h-28 lg:w-36 lg:h-36 rounded-full object-cover border-4 border-white shadow-xl hover:shadow-2xl transition-all duration-300"
                      />
                    )}
                  </div>
                  {/* Saved name and username under the photo (desktop only, fills the photo column) */}
                  <div className="hidden lg:block text-center w-full min-w-0">
                    <p className="font-semibold text-gray-800 leading-snug break-words line-clamp-2">{`${saved.firstName || ''} ${saved.lastName || ''}`.trim()}</p>
                    {saved.username && <p className="text-sm text-gray-500 truncate">@{saved.username}</p>}
                  </div>
                  <label className="upload-btn inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2 text-white rounded-xl cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300">
                    <i className="bx bx-camera text-lg"></i>
                    <span className="font-semibold text-sm">Change Photo</span>
                    <input
                      ref={fileRef}
                      type="file"
                      name="profile_image"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                    />
                  </label>
                  {/* A new photo is only a preview until the form is saved */}
                  {photo && <p className="text-xs text-gray-500 text-center">New photo selected. Press Save Changes to keep it.</p>}
                </div>

                {/* Fields: one column on phones; on wider screens names side by side, then username and
                    mobile, then the email across the full width (no empty gap in the grid) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <Field index={0} icon="bx-user" label="First Name">
                    <input type="text" name="first_name" autoComplete="given-name" value={form.firstName} onChange={set('firstName')} className={inputClass} required />
                  </Field>
                  <Field index={1} icon="bx-user" label="Last Name">
                    <input type="text" name="last_name" autoComplete="family-name" value={form.lastName} onChange={set('lastName')} className={inputClass} required />
                  </Field>
                  <Field index={2} icon="bx-at" label="Username">
                    <input type="text" name="username" autoComplete="username" value={form.username} onChange={set('username')} className={inputClass} required />
                  </Field>
                  <Field index={3} icon="bx-phone" label="Mobile Number">
                    <input
                      type="tel"
                      name="mobile_number"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={mobile}
                      onChange={setMobile}
                      className={inputClass + mobileClass}
                      maxLength={11}
                      placeholder="09XXXXXXXXX"
                    />
                    {checkedMobile && mobileInvalid && (
                      <div id="mobileNumberWarning" className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <i className="bx bx-error-circle text-red-500 mt-0.5"></i>
                          <span className="text-red-700 text-sm font-medium">
                            Mobile number must be exactly 11 digits (e.g., 09123456789)
                          </span>
                        </div>
                      </div>
                    )}
                  </Field>
                  <div className="md:col-span-2">
                    <Field index={4} icon="bx-envelope" label="Email Address">
                      <input type="email" name="email" autoComplete="email" value={form.email} onChange={set('email')} className={inputClass} required />
                    </Field>
                  </div>
                </div>

                {/* Save */}
                <div className="flex justify-center lg:justify-end lg:col-start-2 pt-2 sm:pt-4 lg:pt-0">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary w-full sm:w-auto justify-center inline-flex items-center gap-2 px-8 py-3 text-white font-bold text-base rounded-xl shadow-lg"
                  >
                    <i className="bx bx-save text-lg"></i>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
