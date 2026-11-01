// Green (success) or red (error) message box.
export default function Notice({ type = 'success', children }) {
  return <div className={`notice notice-${type}`}>{children}</div>
}
