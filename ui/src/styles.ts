/**
 * The page's own CSS. The built-in page used the dashboard's utility classes,
 * which exist only while some dashboard source names them; a bundle carries
 * what it draws with, so the same rules are written out here under one
 * `mc-aw-` prefix, with the dashboard's theme tokens (`--text-strong`,
 * `--muted`, `--danger`) so every theme still applies.
 */
export const AW_CSS = `
.mc-aw-root { height:100%; }
.mc-aw-root .lucide-inline { display:inline-block; width:1em; height:1em; vertical-align:-0.125em; flex-shrink:0; }
.mc-aw-pad { padding-left:1rem; padding-right:1rem; }
@media (min-width:768px) { .mc-aw-pad { padding-left:1.5rem; padding-right:1.5rem; } }
.mc-aw-head { padding-top:0.5rem; padding-bottom:0.5rem; }
.mc-aw-chips { padding-bottom:0.5rem; }
.mc-aw-stage { padding-bottom:1.25rem; }
.mc-aw-title { font-size:1.125rem; line-height:1.75rem; font-weight:600; color:var(--text-strong, var(--text)); }
.mc-aw-sub { font-size:0.875rem; line-height:1.25rem; color:var(--muted); }
.mc-aw-overlay-btn { background-color:rgb(0 0 0 / 0.55); transition:color .15s, background-color .15s; }
.mc-aw-overlay-btn:hover { background-color:rgb(0 0 0 / 0.75); }
.mc-aw-notice { padding:0 0.5rem 0.375rem; }
.mc-aw-notice.mc-aw-danger, .mc-aw-notice.mc-aw-danger * { color:var(--danger) !important; }
.mc-aw-notice.mc-aw-red, .mc-aw-notice.mc-aw-red * { color:#f88 !important; }
.mc-aw-warn { display:flex; align-items:flex-start; gap:0.375rem; padding:0 0.5rem 0.375rem; font-size:12px; }
.mc-aw-warn-icon { flex-shrink:0; margin-top:1px; }
.mc-aw-host-notice { padding:1rem 1.5rem; }
`
