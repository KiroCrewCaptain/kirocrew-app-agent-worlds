/**
 * Where this page's pop-out window opens, and whether this window is one.
 *
 * The dashboard opens any app page in a window of its own under
 * `/popout/app/<route>`, with its own store and socket. The page is reached at
 * `/apps/agent-worlds` on a fresh install and at `/worlds` on a copy that took
 * over the built-in (the route the built-in had, which adoption keeps), so the
 * route is read off the address the page was opened at. What comes before it is
 * the dashboard's base path, if it is served under one.
 */

/** Document-path prefix of the dashboard's app pop-out window. */
export const APP_POPOUT_PREFIX = '/popout/app'
/** This page's routes, the most specific first. */
export const PAGE_ROUTES = ['/apps/agent-worlds', '/worlds'] as const

/** Whether the page is rendered in a pop-out window rather than the dashboard. */
export function isPopoutWindow(pathname: string = window.location.pathname): boolean {
  return pathname.includes(APP_POPOUT_PREFIX + '/')
}

/** The pop-out window's address for the page opened at `pathname`. */
export function popoutUrl(pathname: string = window.location.pathname, origin: string = window.location.origin): string {
  for (const route of PAGE_ROUTES) {
    const at = pathname.lastIndexOf(route)
    const end = at + route.length
    if (at >= 0 && (end === pathname.length || pathname[end] === '/')) {
      return origin + pathname.slice(0, at) + APP_POPOUT_PREFIX + route
    }
  }
  return origin + APP_POPOUT_PREFIX + PAGE_ROUTES[0]
}
