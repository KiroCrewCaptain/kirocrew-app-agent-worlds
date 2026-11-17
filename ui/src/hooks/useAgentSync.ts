import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppApi, type HostSessionApproval, type HostSessions } from '@kirocrew/app-sdk'
import { sliceCodePoints } from '../utils/codePoints'
import { pollWhileVisible } from '../utils/pollWhileVisible'

export interface AgentSource {
  id: string
  name: string
  label: string
  kind: 'slot' | 'cron' | 'spawn'
  running: boolean
  detail: string
  /** Real latest message preview for chat slots (empty for crons/spawns) */
  lastMessage?: string
  /** True when the session is waiting for user input */
  waitingForInput?: boolean
  /** Pending tool approval blocking the session, if any. `approval` is the
   *  object the host handed out for it, which is what decides it. */
  pendingApproval?: { tool: string; approval: HostSessionApproval } | null
}

/** What `GET /api/crons` answers, as far as this page reads it. */
interface CronList { jobs?: { id: string; name?: string; enabled?: boolean; is_running?: boolean; schedule: string }[] }
/** What `GET /api/spawn` answers, as far as this page reads it. */
interface SpawnList { agents?: { id: string; task: string; done?: boolean }[] }

const MAX_AGENTS = 8
const CRON_POLL_MS = 5000
const SPAWN_POLL_MS = 3000

function shortName(s: string, max = 45): string {
  if (s.length <= max) return s
  return sliceCodePoints(s, 0, max - 1) + '…'
}

/**
 * The scene's agents: the person's live sessions (newest first, as the session
 * list orders them), then up to three enabled or running crons and three
 * running subagents, eight in all.
 *
 * The sessions are the host's own (`useHostSessions`), titled and labelled as
 * the session list shows them. The crons and subagents are polled through the
 * scoped client, only while the page is on screen.
 */
export function useAgentSync(host: HostSessions) {
  // Read through a ref: the polls start once and read the newest client.
  const api = useAppApi()
  const apiRef = useRef(api)
  apiRef.current = api
  const [extras, setExtras] = useState<AgentSource[]>([])

  const slotAgents = useMemo<AgentSource[]>(() => (host.sessions ?? []).map(s => ({
    id: 'slot-' + s.key, name: shortName(s.title),
    label: s.agentLabel, kind: 'slot' as const,
    running: s.running, detail: s.messageCount + ' msgs',
    lastMessage: s.lastMessage,
    waitingForInput: s.waitingForInput,
    pendingApproval: s.pendingApproval ? { tool: s.pendingApproval.tool, approval: s.pendingApproval } : null,
  })), [host.sessions])

  useEffect(() => {
    let cancelled = false
    let cronBusy = false
    let spawnBusy = false
    let cronResult: AgentSource[] = []
    let spawnResult: AgentSource[] = []
    const update = () => { if (!cancelled) setExtras([...cronResult, ...spawnResult]) }

    // One read of each at a time: a slow answer is not overtaken by the next tick.
    const pollCron = async () => {
      if (cronBusy) return
      cronBusy = true
      try {
        const cronData = await apiRef.current.get<CronList>('/api/crons')
        const jobs = Array.isArray(cronData?.jobs) ? cronData.jobs : []
        cronResult = jobs.filter(c => c.enabled || c.is_running === true).slice(0, 3).map(cr => ({
          id: 'cron-' + cr.id, name: shortName(cr.name || cr.id),
          label: 'cron', kind: 'cron' as const,
          running: cr.is_running === true, detail: cr.schedule,
        }))
      } catch { /* ignore */ }
      cronBusy = false
      update()
    }

    const pollSpawn = async () => {
      if (spawnBusy) return
      spawnBusy = true
      try {
        const spawnData = await apiRef.current.get<SpawnList>('/api/spawn')
        const children = Array.isArray(spawnData?.agents) ? spawnData.agents : []
        spawnResult = children.filter(s => !s.done).slice(0, 3).map(sp => ({
          id: 'spawn-' + sp.id, name: shortName(sp.task, 45),
          label: 'spawn', kind: 'spawn' as const,
          running: !sp.done, detail: sp.done ? 'done' : 'running',
        }))
      } catch { /* ignore */ }
      spawnBusy = false
      update()
    }

    void pollCron(); void pollSpawn()
    const stopCron = pollWhileVisible(() => { void pollCron() }, CRON_POLL_MS)
    const stopSpawn = pollWhileVisible(() => { void pollSpawn() }, SPAWN_POLL_MS)
    return () => { cancelled = true; stopCron(); stopSpawn() }
  }, [])

  const agents = useMemo(() => [...slotAgents, ...extras].slice(0, MAX_AGENTS), [slotAgents, extras])
  return { agents, maxAgents: MAX_AGENTS }
}
