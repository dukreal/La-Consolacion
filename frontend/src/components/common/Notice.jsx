// Green (success), red (error) or blue (info) message box.
export default function Notice({ type = 'success', children }) {
  return <div className={`notice notice-${type}`}>{children}</div>
}
