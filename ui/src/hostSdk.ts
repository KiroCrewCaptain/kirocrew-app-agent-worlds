/**
 * The host seams above App Kit level 0 this page uses, read off a namespace
 * import. A named import of an export the host does not provide fails the whole
 * bundle at load; read this way, an older host leaves the name undefined and
 * the page says what it needs instead.
 *
 * `useHostSessions` (App Kit level 8) is the dashboard's own live session list
 * and the acts the page takes on a session: reply or steer, decide its pending
 * tool approval, start a new session. Each is admitted by this app's declared
 * `permissions.api`.
 */
import * as sdk from '@kirocrew/app-sdk'

export const useHostSessions = (sdk as { useHostSessions?: typeof sdk.useHostSessions }).useHostSessions
