import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithHost } from './helpers'
import { stubHost } from './stubs/app-sdk'
import WorldsPopout from '../src/pages/WorldsPopout'

vi.mock('../src/hooks/useAgentSync', () => ({
  useAgentSync: () => ({
    agents: [
      { id: 'slot-1', name: 'Alpha', label: 'default', kind: 'slot', running: true, detail: '3 msgs' },
    ],
    maxAgents: 8,
  }),
}))

const { mockBroadcastScene } = vi.hoisted(() => ({
  mockBroadcastScene: vi.fn(),
}))

vi.mock('../src/hooks/usePopoutSync', () => ({
  usePopoutSync: () => ({ popoutActive: false, broadcastScene: mockBroadcastScene, openPopout: vi.fn() }),
}))

vi.mock('../src/pages/scenes/OfficeScene', () => ({ default: (p: { agents?: unknown[] }) => <div data-testid="scene-office">OfficeScene ({p.agents?.length ?? 0})</div> }))
vi.mock('../src/pages/scenes/NeuralConstellationScene', () => ({ default: (p: { agents: unknown[] }) => <div data-testid="scene-neural">NeuralScene ({p.agents.length})</div> }))
vi.mock('../src/pages/scenes/WizardTowerScene', () => ({ default: (p: { agents: unknown[] }) => <div data-testid="scene-wizard">WizardScene ({p.agents.length})</div> }))
vi.mock('../src/pages/scenes/UnderwaterLabScene', () => ({ default: (p: { agents: unknown[] }) => <div data-testid="scene-underwater">UnderwaterScene ({p.agents.length})</div> }))
vi.mock('../src/pages/scenes/mission-control/MissionControlScene', () => ({ default: (p: { agents: unknown[] }) => <div data-testid="scene-mission">MissionScene ({p.agents.length})</div> }))
vi.mock('../src/pages/scenes/HanoiScene', () => ({ default: (p: { agents: unknown[] }) => <div data-testid="scene-hanoi">HanoiScene ({p.agents.length})</div> }))

beforeEach(() => { localStorage.clear(); mockBroadcastScene.mockClear() })

describe('WorldsPopout', () => {
  it('renders all scene tab buttons', () => {
    renderWithHost(<WorldsPopout host={stubHost} />)
    expect(screen.getByText('Office')).toBeInTheDocument()
    expect(screen.getByText('Neural Net')).toBeInTheDocument()
    expect(screen.getByText('Wizard Tower')).toBeInTheDocument()
    expect(screen.getByText('Deep Lab')).toBeInTheDocument()
    expect(screen.getByText('Mission Control')).toBeInTheDocument()
    expect(screen.getByText('Hà Nội')).toBeInTheDocument()
  })

  it('shows office scene by default', () => {
    renderWithHost(<WorldsPopout host={stubHost} />)
    const officeWrapper = screen.getByTestId('scene-office').parentElement!
    expect(officeWrapper.style.display).not.toBe('none')
  })

  it('switches scene on tab click', () => {
    renderWithHost(<WorldsPopout host={stubHost} />)
    fireEvent.click(screen.getByText('Wizard Tower'))
    const wizardWrapper = screen.getByTestId('scene-wizard').parentElement!
    expect(wizardWrapper.style.display).not.toBe('none')
    const officeWrapper = screen.getByTestId('scene-office').parentElement!
    expect(officeWrapper.style.display).toBe('none')
  })

  it('keeps all scenes mounted when switching', () => {
    renderWithHost(<WorldsPopout host={stubHost} />)
    fireEvent.click(screen.getByText('Neural Net'))
    expect(screen.getByTestId('scene-office')).toBeInTheDocument()
    expect(screen.getByTestId('scene-neural')).toBeInTheDocument()
    expect(screen.getByTestId('scene-wizard')).toBeInTheDocument()
    expect(screen.getByTestId('scene-underwater')).toBeInTheDocument()
    expect(screen.getByTestId('scene-mission')).toBeInTheDocument()
  })

  it('persists scene selection to localStorage', () => {
    renderWithHost(<WorldsPopout host={stubHost} />)
    fireEvent.click(screen.getByText('Deep Lab'))
    expect(localStorage.getItem('mc-agent-scene')).toBe('underwater')
  })

  it('restores scene from localStorage', () => {
    localStorage.setItem('mc-agent-scene', 'wizard')
    renderWithHost(<WorldsPopout host={stubHost} />)
    const wizardWrapper = screen.getByTestId('scene-wizard').parentElement!
    expect(wizardWrapper.style.display).not.toBe('none')
  })

  it('falls back to office when the saved scene is not one this build has', () => {
    // A key saved by another build (a scene added later, then a downgrade)
    // matched no scene, so every scene stayed hidden and no chip was checked.
    localStorage.setItem('mc-agent-scene', 'retired-scene')
    renderWithHost(<WorldsPopout host={stubHost} />)
    const officeWrapper = screen.getByTestId('scene-office').parentElement!
    expect(officeWrapper.style.display).not.toBe('none')
    expect(screen.getByRole('radio', { name: /Office/ })).toHaveAttribute('aria-checked', 'true')
  })

  it('has collapse/expand toggle', () => {
    renderWithHost(<WorldsPopout host={stubHost} />)
    const toggle = screen.getByTitle('Hide controls')
    expect(toggle.querySelector('svg.lucide-chevron-up')).not.toBeNull()
    fireEvent.click(toggle)
    expect(screen.getByTitle('Show controls').querySelector('svg.lucide-chevron-down')).not.toBeNull()
  })

  it('passes agents to scenes', () => {
    renderWithHost(<WorldsPopout host={stubHost} />)
    expect(screen.getByTestId('scene-office')).toHaveTextContent('OfficeScene (1)')
  })

  it('broadcasts scene change', () => {
    renderWithHost(<WorldsPopout host={stubHost} />)
    fireEvent.click(screen.getByText('Wizard Tower'))
    expect(mockBroadcastScene).toHaveBeenCalledWith('wizard')
  })
})
