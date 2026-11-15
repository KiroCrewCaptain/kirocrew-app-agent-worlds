/**
 * Types for the two host modules this bundle imports. They are not on npm: the
 * dashboard's import map serves them at runtime (`/vendor/*.mjs`), so only the
 * names this page uses are declared, with the shapes the App Kit documents.
 *
 * Every name a plain named import reads exists on a host before App Kit level
 * 1; `tests/test_manifest_contract.py` checks the built bundle for that.
 * `useHostSessions` (App Kit level 8) is read off a namespace import in
 * `src/hostSdk.ts`, so an older host loads the page and it says what it needs.
 */

declare module '@kirocrew/app-sdk' {
  export interface AppApi {
    request<T = unknown>(path: string, init?: RequestInit): Promise<T>
    get<T = unknown>(path: string, init?: RequestInit): Promise<T>
  }

  export interface ChatLaunchOptions {
    agent?: string
    message?: string
    slotKey?: string
    autoSend?: boolean
  }

  type KeyEvent = import('react').KeyboardEvent
  type Handlers<T extends HTMLElement> = Pick<
    import('react').InputHTMLAttributes<T>,
    'onKeyDown' | 'onCompositionStart' | 'onCompositionEnd' | 'onFocus' | 'onBlur'
  >

  export interface ImeGuard {
    /** True when this Enter is the user's (not an IME commit); consumes it. */
    claimEnter(e: KeyEvent): boolean
    claimKey(e: KeyEvent): boolean
    bindComposition<T extends HTMLElement = HTMLInputElement>(opts?: {
      onFocus?: () => void
      onBlur?: () => void
    }): Omit<Handlers<T>, 'onKeyDown'>
  }

  export type NumberOptions = Omit<Intl.NumberFormatOptions, 'localeMatcher'>

  /** A tool approval a session waits on; decide it by passing it back to `decide`. */
  export interface HostSessionApproval {
    readonly sessionKey: string
    readonly tool: string
    /** One string per request. */
    readonly key: string
  }

  export interface HostSession {
    readonly key: string
    readonly title: string
    readonly agentLabel: string
    readonly running: boolean
    readonly messageCount: number
    readonly lastMessage: string
    readonly waitingForInput: boolean
    readonly pendingApproval: HostSessionApproval | null
    readonly lastActive: number
  }

  export interface HostSessionSendResult {
    readonly status: 'dispatched' | 'queued' | 'refused' | 'unknown' | 'response-late' | 'transport-error'
    readonly reason?: string
  }

  export type HostSessionDecision =
    | { readonly outcome: 'decided' }
    | { readonly outcome: 'settled' | 'gone'; readonly message: string }
    | { readonly outcome: 'failed'; readonly message: string; readonly report?: unknown }

  export interface HostSessions {
    readonly sessions: readonly HostSession[] | null
    readonly can: { readonly sessions: boolean; readonly send: boolean; readonly decide: boolean; readonly create: boolean }
    send(sessionKey: string, message: string, opts?: { steer?: boolean }): Promise<HostSessionSendResult>
    decide(approval: HostSessionApproval, action: 'approve' | 'reject'): Promise<HostSessionDecision>
    create(): Promise<{ key: string }>
  }

  export function useAppApi(): AppApi
  export function useChatLauncher(): { openChat: (opts?: ChatLaunchOptions) => void }
  export function useImeGuard(): ImeGuard
  export function useLanguageGeneration(): number
  export function activeLocale(): string
  export function fmtNumber(value: number, options?: NumberOptions): string
  /** App Kit level 8; absent on an older host, so read it through `src/hostSdk.ts`. */
  export const useHostSessions: (() => HostSessions) | undefined
}

declare module '@kirocrew/app-sdk/ui' {
  import type { ComponentType } from 'react'

  export const ErrorNotice: ComponentType<{
    message?: string | null
    variant?: 'block' | 'inline'
    className?: string
    testId?: string
    report?: unknown
  }>
}
