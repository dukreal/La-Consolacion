const ICONS = { success: 'bx-check-circle', error: 'bx-error-circle', info: 'bx-info-circle' }

// Green (success), red (error) or blue (info) message box, with an icon.
export default function Notice({ type = 'success', children }) {
  return (
    <div className={`notice notice-${type}`}>
      <i className={`bx ${ICONS[type] || ICONS.info} notice-icon`} aria-hidden="true"></i>
      <div className="notice-body">{children}</div>
    </div>
  )
}
