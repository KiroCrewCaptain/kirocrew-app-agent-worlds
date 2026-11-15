import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import type { HostSessions } from '@kirocrew/app-sdk'
import { HostSessionsContext } from '../src/hooks/hostSessionsContext'
import { stubHost } from './stubs/app-sdk'

/** Render under the page's host context (the stub host unless one is given). */
export function renderWithHost(ui: ReactElement, host: HostSessions = stubHost, options?: RenderOptions) {
  return render(<HostSessionsContext.Provider value={host}>{ui}</HostSessionsContext.Provider>, options)
}
