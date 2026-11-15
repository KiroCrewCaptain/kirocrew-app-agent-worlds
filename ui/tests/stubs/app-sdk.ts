/**
 * A light stand-in for the host's `@kirocrew/app-sdk`.
 *
 * Only the names the bundle uses, with the host's documented behaviour where a
 * test depends on it. The `stub*` / `resetStubSdk` exports are test controls; no
 * host module has them. A test that needs a different host shape replaces this
 * module with `vi.mock`.
 */

import { vi } from 'vitest'
import type { KeyboardEvent } from 'react'
import type { AppApi, ChatLaunchOptions, HostSessions, NumberOptions } from '@kirocrew/app-sdk'

let locale = 'en'

/** The host's active language for the next lookups. */
export function stubLocale(next: string): void {
  locale = next
}

export const stubOpenChat = vi.fn<(opts?: ChatLaunchOptions) => void>()

/** Answers the scoped client's GETs by path; a test sets entries. Unset paths reject. */
export const stubRoutes = new Map<string, unknown>()
/** Every path the scoped client was asked for, in order. */
export const stubRequests: string[] = []

const answer = async <T,>(path: string): Promise<T> => {
  stubRequests.push(path)
  const route = path.split('?')[0]
  if (!stubRoutes.has(route)) throw new Error(`stub app-sdk: no answer for ${route}`)
  const value = stubRoutes.get(route)
  if (value instanceof Error) throw value
  return value as T
}

/** The scoped client `useAppApi()` returns. */
export const stubApi: AppApi = { request: answer, get: answer }

/** The host's session control `useHostSessions()` returns; a test replaces it. */
export let stubHost: HostSessions = makeStubHost()

export function makeStubHost(over: Partial<HostSessions> = {}): HostSessions {
  return {
    sessions: [],
    can: { sessions: true, send: true, decide: true, create: true },
    send: vi.fn(async () => ({ status: 'dispatched' as const })),
    decide: vi.fn(async () => ({ outcome: 'decided' as const })),
    create: vi.fn(async () => ({ key: 'chat-new' })),
    ...over,
  }
}

export function setStubHost(host: HostSessions): void {
  stubHost = host
}

export function resetStubSdk(): void {
  locale = 'en'
  stubOpenChat.mockReset()
  stubRoutes.clear()
  stubRequests.length = 0
  stubHost = makeStubHost()
}

export function activeLocale(): string {
  return locale
}

export function useLanguageGeneration(): number {
  return 0
}

export function fmtNumber(value: number, options?: NumberOptions): string {
  if (!Number.isFinite(value)) return '-'
  return new Intl.NumberFormat(locale, options).format(value)
}

export function useAppApi(): AppApi {
  return stubApi
}

export function useChatLauncher(): { openChat: (opts?: ChatLaunchOptions) => void } {
  return { openChat: stubOpenChat }
}

/** App Kit level 8: present on this stub host. */
export function useHostSessions(): HostSessions {
  return stubHost
}

/** The host guard's contract minus its composition latch: an Enter typed while
 *  an IME composes is not claimed. */
export function useImeGuard() {
  const composing = (e: KeyboardEvent) => e.nativeEvent?.isComposing === true || e.keyCode === 229
  const claimEnter = (e: KeyboardEvent) => {
    if (composing(e)) return false
    e.preventDefault()
    return true
  }
  const claimKey = (e: KeyboardEvent) => !composing(e)
  const bindComposition = (opts: { onFocus?: () => void; onBlur?: () => void } = {}) => ({
    onFocus: opts.onFocus,
    onBlur: opts.onBlur,
  })
  return { claimEnter, claimKey, bindComposition }
}
