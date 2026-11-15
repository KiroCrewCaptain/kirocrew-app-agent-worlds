import { createContext } from 'react'
import type { HostSessions } from '@kirocrew/app-sdk'

/** The host's session control for every scene's popover, set once by the page
 *  so the eight scenes keep the built-in's call shape. Null outside the page. */
export const HostSessionsContext = createContext<HostSessions | null>(null)
