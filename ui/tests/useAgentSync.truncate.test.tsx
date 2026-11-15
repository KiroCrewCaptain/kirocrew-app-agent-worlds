import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAgentSync } from '../src/hooks/useAgentSync'
import { makeStubHost, stubRoutes } from './stubs/app-sdk'

// kirodotdev/KiroCrew#24727: the 45-unit agent name cap must not keep half
// of an emoji. A lone high surrogate before the ellipsis renders as U+FFFD in
// the scene rail.
const LONE_HIGH = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])/

async function cronName(name: string): Promise<string> {
  stubRoutes.set('/api/crons', { jobs: [{ id: 'job-1', name, enabled: true, schedule: 'every 5m' }] })
  stubRoutes.set('/api/spawn', { agents: [] })
  const { result } = renderHook(() => useAgentSync(makeStubHost()))
  let shown = ''
  await waitFor(() => {
    const cron = result.current.agents.find(a => a.id === 'cron-job-1')
    expect(cron).toBeDefined()
    shown = cron!.name
  })
  return shown
}

describe('useAgentSync agent name truncation', () => {
  it('drops an emoji the 45-unit name cap would cut in half', async () => {
    const name = await cronName(`${'a'.repeat(43)}🎉 tail`)
    expect(name).toBe(`${'a'.repeat(43)}…`)
    expect(name).not.toMatch(LONE_HIGH)
  })

  it('keeps an emoji that ends exactly at the cut', async () => {
    expect(await cronName(`${'a'.repeat(42)}🎉 tail`)).toBe(`${'a'.repeat(42)}🎉…`)
  })
})
