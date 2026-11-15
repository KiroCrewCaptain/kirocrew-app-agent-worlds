/**
 * Best-effort localStorage writes.
 *
 * The page saves two small things: the scene the user chose and which agents
 * a scene has already greeted. Neither is worth an error, so a write that throws
 * (storage full, storage disabled) is dropped. The dashboard's own helper also
 * frees space by deleting the dashboard's cache entries; this page owns none of
 * those entries, so it never deletes them.
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}
