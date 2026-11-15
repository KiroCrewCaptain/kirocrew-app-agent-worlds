/**
 * The bundle's entry: the page on a host with the session seam, the pop-out
 * layout in the dashboard's pop-out window, and a notice (never a blank page or
 * a load failure) on a host without it.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { makeStubHost, setStubHost, stubRoutes } from './stubs/app-sdk'

const seam = vi.hoisted(() => ({ present: true }))
vi.mock('../src/hostSdk', async () => {
  const sdk = await import('./stubs/app-sdk')
  return { get useHostSessions() { return seam.present ? sdk.useHostSessions : undefined } }
})

import AgentWorldsApp from '../src/index'

beforeEach(() => {
  seam.present = true
  stubRoutes.set('/api/crons', { jobs: [] })
  stubRoutes.set('/api/spawn', { agents: [] })
})

describe('AgentWorldsApp', () => {
  it('renders the page with its title and the host sessions', () => {
    setStubHost(makeStubHost({ sessions: [
      { key: 'chat-a', title: 'Fix the build', agentLabel: 'reviewer', running: true, messageCount: 2, lastMessage: '', waitingForInput: false, pendingApproval: null, lastActive: 1 },
    ] }))
    render(<AgentWorldsApp />)
    expect(screen.getByText(/Agent Worlds/)).toBeInTheDocument()
    expect(screen.getByText(/1 agent present/)).toBeInTheDocument()
    expect(screen.queryByTestId('aw-host-too-old')).not.toBeInTheDocument()
  })

  it('says what it needs on a host without the session seam', () => {
    seam.present = false
    render(<AgentWorldsApp />)
    expect(screen.getByTestId('aw-host-too-old')).toHaveTextContent('Update Kiro Crew')
  })

  it('says the same when the host does not admit the session list', () => {
    setStubHost(makeStubHost({ sessions: null, can: { sessions: false, send: false, decide: false, create: false } }))
    render(<AgentWorldsApp />)
    expect(screen.getByTestId('aw-host-too-old')).toBeInTheDocument()
  })

  it('renders the pop-out layout in the dashboard pop-out window', () => {
    window.history.replaceState(null, '', '/popout/app/worlds')
    render(<AgentWorldsApp />)
    // The pop-out has the scene chooser and no page title.
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    expect(screen.queryByText(/agents? present/)).not.toBeInTheDocument()
  })
})
