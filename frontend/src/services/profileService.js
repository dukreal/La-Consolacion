import { api } from './api'

// Does the logged-in user have a phone number (10+ characters)? Needed before checkout.
export async function checkProfileCompletion() {
  const data = await api('/auth/check-profile-completion.php')
  if (!data.success) throw new Error('Failed to check profile')
  return data.hasPhoneNumber
}
