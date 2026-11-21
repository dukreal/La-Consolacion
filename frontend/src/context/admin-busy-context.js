import { createContext } from 'react'

// Lets an admin page tell the admin frame "I am reloading" so it shows the thin bar under the top bar.
// The value is markBusy(+1 / -1); see hooks/useRefreshing.js.
export const AdminBusyContext = createContext(() => {})
