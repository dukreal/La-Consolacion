import { api } from './api'

// Does the logged-in user have a phone number (10+ characters)? Needed before checkout.
export async function checkProfileCompletion() {
  const data = await api('/auth/check-profile-completion.php')
  if (!data.success) throw new Error('Failed to check profile')
  return data.hasPhoneNumber
}

// The logged-in user's profile: { firstName, lastName, username, email, mobileNumber, profileImage }
export async function getProfile() {
  const data = await api('/users/get-profile.php')
  if (!data.success) throw new Error(data.error || 'Could not load your profile')
  return data.user
}

// Saves the profile (and a new photo when one is chosen).
// Returns PHP's answer: { success, message, user } or { success: false, errors: [...] }
export function updateProfile({ firstName, lastName, username, email, mobileNumber, photo }) {
  const form = new FormData()
  form.append('first_name', firstName)
  form.append('last_name', lastName)
  form.append('username', username)
  form.append('email', email)
  form.append('mobile_number', mobileNumber)
  if (photo) form.append('profile_image', photo)
  return api('/users/update-profile.php', { method: 'POST', form })
}

// The mobile number saved in the user's profile ('' when there is none or it cannot be read).
// Used to fill in "Your Mobile No." on the payment step; the customer can still change it there.
export async function getProfileMobile() {
  try {
    const data = await api('/auth/check-profile-completion.php')
    return data.success && data.mobileNumber ? String(data.mobileNumber).replace(/\D/g, '').slice(0, 11) : ''
  } catch {
    return ''
  }
}
