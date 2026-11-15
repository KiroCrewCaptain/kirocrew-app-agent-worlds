/**
 * The scene's agents are the host's sessions as the session list shows them,
 * then the crons and subagents read through the scoped client.
 *
 * Titles, agent labels, recency order and the approval each session waits on
 * are the host's (`useHostSessions`, pinned in Kiro Crew's own tests); this
 * page carries them over unchanged and adds no session of its own.
 */
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { HostSession } from '@kirocrew/app-sdk'
import { useAgentSync } from '../src/hooks/useAgentSync'
import { makeStubHost, stubRequests, stubRoutes } from './stubs/app-sdk'

const approval = Object.freeze({ sessionKey: 'chat-a', tool: 'shell', key: 'native|chat-a|r-1|m-1' })
const SESSIONS: HostSession[] = [
  { key: 'chat-a', title: 'Fix the build', agentLabel: 'reviewer', running: true, messageCount: 4, lastMessage: 'on it', waitingForInput: false, pendingApproval: approval, lastActive: 2 },
  { key: 'chat-b', title: 'Untitled session', agentLabel: 'Default', running: false, messageCount: 0, lastMessage: '', waitingForInput: true, pendingApproval: null, lastActive: 1 },
]

describe('useAgentSync', () => {
  it('maps each host session in the host order, keeping its approval object', async () => {
    stubRoutes.set('/api/crons', { jobs: [] })
    stubRoutes.set('/api/spawn', { agents: [] })
    const { result } = renderHook(() => useAgentSync(makeStubHost({ sessions: SESSIONS })))
    const [a, b] = result.current.agents
    expect(a).toMatchObject({ id: 'slot-chat-a', name: 'Fix the build', label: 'reviewer', kind: 'slot', running: true, detail: '4 msgs', lastMessage: 'on it' })
    expect(a.pendingApproval?.approval).toBe(approval)
    expect(a.pendingApproval?.tool).toBe('shell')
    expect(b).toMatchObject({ id: 'slot-chat-b', name: 'Untitled session', waitingForInput: true, pendingApproval: null })
    await waitFor(() => expect(stubRequests).toEqual(expect.arrayContaining(['/api/crons', '/api/spawn'])))
  })

  it('adds up to three live crons and three running subagents, eight agents in all', async () => {
    stubRoutes.set('/api/crons', { jobs: [
      { id: 'c1', name: 'nightly', enabled: true, schedule: '0 2 * * *' },
      { id: 'c2', name: 'paused', enabled: false, schedule: 'x' },
      { id: 'c3', name: 'running-paused', enabled: false, is_running: true, schedule: 'y' },
      { id: 'c4', enabled: true, schedule: 'z' },
      { id: 'c5', name: 'over', enabled: true, schedule: 'w' },
    ] })
    stubRoutes.set('/api/spawn', { agents: [
      { id: 's1', task: 'scan logs' }, { id: 's2', task: 'done one', done: true },
      { id: 's3', task: 'write tests' }, { id: 's4', task: 'third' }, { id: 's5', task: 'fourth' },
    ] })
    const { result } = renderHook(() => useAgentSync(makeStubHost({ sessions: SESSIONS })))
    await waitFor(() => expect(result.current.agents.length).toBe(8))
    const ids = result.current.agents.map(x => x.id)
    expect(ids).toEqual(['slot-chat-a', 'slot-chat-b', 'cron-c1', 'cron-c3', 'cron-c4', 'spawn-s1', 'spawn-s3', 'spawn-s4'])
    expect(result.current.agents.find(x => x.id === 'cron-c4')!.name).toBe('c4')
    expect(result.current.agents.find(x => x.id === 'cron-c3')!.running).toBe(true)
  })

  it('a failed poll leaves the sessions on screen', async () => {
    stubRoutes.set('/api/crons', new Error('offline'))
    stubRoutes.set('/api/spawn', new Error('offline'))
    const { result } = renderHook(() => useAgentSync(makeStubHost({ sessions: SESSIONS })))
    await waitFor(() => expect(stubRequests.length).toBeGreaterThanOrEqual(2))
    expect(result.current.agents.map(x => x.id)).toEqual(['slot-chat-a', 'slot-chat-b'])
  })
})
