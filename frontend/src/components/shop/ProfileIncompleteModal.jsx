import SiteDialog from '../common/SiteDialog'

// Shown when someone tries to buy without a phone number on their profile.
export default function ProfileIncompleteModal({ onClose, onUpdateProfile }) {
  return (
    <SiteDialog
      variant="info"
      icon="bx-phone"
      title="Complete your profile"
      message="Add your phone number to your profile so we can contact you about your order and pickup."
      cancelLabel="Continue Shopping"
      confirmLabel="Add phone number"
      onConfirm={onUpdateProfile}
      onClose={onClose}
    />
  )
}
