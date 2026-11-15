/**
 * The pop-out window is the dashboard's own app pop-out (`/popout/app/<route>`),
 * opened for whichever route the page is on: `/apps/agent-worlds` on a fresh
 * install, `/worlds` on a copy that took over the built-in.
 */
import { describe, it, expect } from 'vitest'
import { isPopoutWindow, popoutUrl } from '../src/utils/popoutRoute'

const ORIGIN = 'http://127.0.0.1:8899'

describe('popoutUrl', () => {
  it.each([
    ['/apps/agent-worlds', '/popout/app/apps/agent-worlds'],
    ['/worlds', '/popout/app/worlds'],
    ['/worlds/', '/popout/app/worlds'],
    ['/kc/worlds', '/kc/popout/app/worlds'],
    ['/kc/apps/agent-worlds', '/kc/popout/app/apps/agent-worlds'],
  ])('opens %s at %s', (pathname, expected) => {
    expect(popoutUrl(pathname, ORIGIN)).toBe(ORIGIN + expected)
  })

  it('falls back to the fresh-install route for an address it cannot read', () => {
    expect(popoutUrl('/somewhere/else', ORIGIN)).toBe(ORIGIN + '/popout/app/apps/agent-worlds')
  })

  it('does not take a longer segment for the route', () => {
    expect(popoutUrl('/worldsx', ORIGIN)).toBe(ORIGIN + '/popout/app/apps/agent-worlds')
  })
})

describe('isPopoutWindow', () => {
  it.each([
    ['/popout/app/worlds', true],
    ['/kc/popout/app/apps/agent-worlds', true],
    ['/worlds', false],
    ['/apps/agent-worlds', false],
    ['/popout/chat/x', false],
  ])('%s is %s', (pathname, expected) => {
    expect(isPopoutWindow(pathname)).toBe(expected)
  })
})
