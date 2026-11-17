/**
 * The crons and subagents are read only while the page is on screen, and only
 * one read of each kind is out at a time (the wheel copy's kirodotdev/KiroCrew#37549).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAgentSync } from '../src/hooks/useAgentSync'
import { makeStubHost, stubRequests, stubRoutes } from './stubs/app-sdk'

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') })
  document.dispatchEvent(new Event('visibilitychange'))
}

const reads = (path: string) => stubRequests.filter(p => p === path).length

async function advance(ms: number) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms) })
}

describe('useAgentSync polling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setHidden(false)
    stubRoutes.set('/api/crons', { jobs: [] })
    stubRoutes.set('/api/spawn', { agents: [] })
  })
  afterEach(() => {
    vi.useRealTimers()
    setHidden(false)
  })

  it('reads once on mount, then on each cadence while the page is visible', async () => {
    const { unmount } = renderHook(() => useAgentSync(makeStubHost()))
    await advance(0)
    expect([reads('/api/crons'), reads('/api/spawn')]).toEqual([1, 1])
    await advance(15_000)
    // Crons every 5 s, subagents every 3 s.
    expect([reads('/api/crons'), reads('/api/spawn')]).toEqual([4, 6])
    unmount()
  })

  it('reads nothing while the page is hidden, and once at once when it is shown again', async () => {
    const { unmount } = renderHook(() => useAgentSync(makeStubHost()))
    await advance(0)
    act(() => setHidden(true))
    await advance(60_000)
    expect([reads('/api/crons'), reads('/api/spawn')]).toEqual([1, 1])
    act(() => setHidden(false))
    await advance(0)
    expect([reads('/api/crons'), reads('/api/spawn')]).toEqual([2, 2])
    unmount()
  })

  it('skips a tick while the previous read of the same kind is still out', async () => {
    let answer: (value: unknown) => void = () => {}
    stubRoutes.set('/api/crons', new Promise(resolve => { answer = resolve }))
    const { unmount } = renderHook(() => useAgentSync(makeStubHost()))
    await advance(20_000)
    expect(reads('/api/crons')).toBe(1)
    stubRoutes.set('/api/crons', { jobs: [] })
    answer({ jobs: [] })
    await advance(5_000)
    expect(reads('/api/crons')).toBe(2)
    unmount()
  })

  it('stops reading once the page unmounts', async () => {
    const { unmount } = renderHook(() => useAgentSync(makeStubHost()))
    await advance(0)
    unmount()
    await advance(60_000)
    expect([reads('/api/crons'), reads('/api/spawn')]).toEqual([1, 1])
  })
})
