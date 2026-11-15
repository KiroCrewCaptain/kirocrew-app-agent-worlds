/**
 * The bundle's entry: AppHost lazy-imports this module and renders its default
 * export as the app's page.
 *
 * It subscribes to the host's language generation, which is what repaints the
 * page on a language switch (`i18nT` reads the active locale at call time, and
 * this component's re-render reaches every child), and hands the host's
 * session control to the scenes. In the dashboard's pop-out window it renders
 * the pop-out layout, which keeps the scene in sync with the main page.
 */

import { useLanguageGeneration } from '@kirocrew/app-sdk'
import { ErrorNotice } from '@kirocrew/app-sdk/ui'
import { useHostSessions } from './hostSdk'
import { HostSessionsContext } from './hooks/hostSessionsContext'
import { i18nT } from './i18n/t'
import WorldsPage from './pages/WorldsPage'
import WorldsPopout from './pages/WorldsPopout'
import { AW_CSS } from './styles'
import { isPopoutWindow } from './utils/popoutRoute'

function Worlds({ useSessions }: { useSessions: NonNullable<typeof useHostSessions> }) {
  const host = useSessions()
  // The list is what every scene draws; without it the page has nothing to show.
  if (!host.can.sessions) return <HostTooOld />
  return (
    <HostSessionsContext.Provider value={host}>
      {isPopoutWindow() ? <WorldsPopout host={host} /> : <WorldsPage host={host} />}
    </HostSessionsContext.Provider>
  )
}

function HostTooOld() {
  return (
    <div className="mc-aw-host-notice">
      <ErrorNotice variant="block" testId="aw-host-too-old" message={i18nT('app.needs_newer_host')} />
    </div>
  )
}

export default function AgentWorldsApp() {
  useLanguageGeneration()
  return (
    <div className="mc-aw-root">
      <style>{AW_CSS}</style>
      {useHostSessions ? <Worlds useSessions={useHostSessions} /> : <HostTooOld />}
    </div>
  )
}
