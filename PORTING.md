# Porting notes: built-in → external app

This repository was ported from Kiro Crew's built-in Agent Worlds: its manifest
at `src/kiro_crew/apps/builtins/agent_worlds/app.json`, its page at
`website/src/pages/WorldsPage.tsx` and `website/src/pages/WorldsPopout.tsx`, its
scenes under `website/src/pages/scenes/`, the scene hooks under
`website/src/hooks/` (`useAgentSync`, `useSceneInteraction`, `usePopoutSync`,
`sceneCanvas`, `sceneStateCache`, `sceneText`), its store art under
`website/public/app-assets/worlds/`, and the tests for all of them (KiroCrew
`main` at `33979525d8`). The built-in's changes since are ported up to KiroCrew
`main` `2e2503671f` (see [Synced with the wheel copy](#synced-with-the-wheel-copy)).

The page reaches Kiro Crew only through the App SDK. The one host seam it needed
that no app had was added for it: `useHostSessions`, App Kit level 8
(kirodotdev/KiroCrew#37426), which hands an app page the dashboard's own live
session list and the acts the page takes on a session, each admitted by the
app's declared `permissions.api`.

## What carried over unchanged

- `app.json` `name` (`agent-worlds`), `permissions`,
  `platform`, `defaultEnabled` (`false`), `tags`, `useCases` and
  `configuration`. `tests/test_manifest_contract.py` compares the ones adoption
  reads with the built-in's manifest (`tests/fixtures/builtin-app.json`).
  `permissions.api` is the list the built-in's wheel copy declares for the host
  paths its page calls (kirodotdev/KiroCrew#37426): `=/api/chat`,
  `/api/chat/slots`, `/api/approvals`, `=/api/crons`, `=/api/spawn`,
  `=/api/config/default-agent` and `=/api/dashboard/config`, so adoption is no
  widening.
- Every scene, line for line: drawing, layout, animation, labels, the
  speech bubbles and the greeting cache.
- The page's behaviour: up to eight agents (the newest sessions, then up to
  three enabled or running crons and three running subagents), the tooltip, the
  mini thread with its 2-second refresh, reply and steer, the approval bar and
  its gone and settled states, Open chat, the New session sign, the collapsible
  header and the pop-out with its scene sync.
- The saved-state keys `mc-agent-scene` and `mc-scene-known-agents`, and the
  pop-out channel `kirocrew-worlds-popout`, so an existing user's chosen scene
  comes back.
- The strings, in every language the dashboard ships, under the same keys
  (`ui/i18n/<locale>.json`).

## Version

The `version` started equal to the built-in's (`1.0.0`) and only moves up:
adoption matches it against Kiro Crew's pin of one commit here, and the pin
moves the built-in's version with it. `1.0.1` is the first release; `1.0.2`
carries the wheel copy's changes up to KiroCrew `main` `2e2503671f` and is the one
the pin names.

## What changed, and why

| Built-in | Here | Why |
|---|---|---|
| The session list from the dashboard's store (`selectSlotsWithLiveLastTs`), titled with `sessionDisplayTitle`, labelled with `agentOrDefaultLabel` against `GET /api/config/default-agent` (`hooks/useAgentSync.ts`) | `useHostSessions().sessions` (`ui/src/hooks/useAgentSync.ts`) | A bundle cannot read the dashboard's store. The seam projects the same list with the same title, label, live state and recency order. |
| `sendTurn({ message, slot, steer })` (`hooks/useSceneInteraction.tsx`) | `useHostSessions().send(key, message, { steer })` | The seam runs the dashboard's own send and returns its receipt status, so the composer's refused, unconfirmed and accepted handling is unchanged. |
| `api.decideApproval(target, action)` with the target built from the slot's approval fields | `useHostSessions().decide(approval, action)` | The seam keeps the decide target and hands out an approval object, so the page decides only a request the dashboard showed it. The outcome carries the dashboard approval card's own sentence. |
| `api.createChatSlot()` | `useHostSessions().create()` | Through the scoped client a create would make a session the app owns; the seam makes the person's, as the built-in did. |
| `api.chatSlotDetail(key, 24)`, `api.crons()`, `api.spawnList()` | `useAppApi().get(...)` on `/api/chat/slots/<key>?limit=24`, `/api/crons`, `/api/spawn` | Plain reads the scoped client admits under the declared paths. |
| `dispatch(switchSlot(...))` and `navigate('/chat')` for Open chat | `useChatLauncher().openChat({ slotKey })` | The SDK's chat launch activates that exact session in the chat. |
| The pop-out window at the dashboard's own `/worlds-popout` route (`pages/WorldsPopout.tsx`, `main.tsx`), which polled `fetchSlots()` every 5 seconds | The dashboard's app pop-out window, `/popout/app/<route>` (`ui/src/utils/popoutRoute.ts`), rendering the pop-out layout (`ui/src/index.tsx`) | `/worlds-popout` is a core route that leaves with the built-in. The app pop-out window has its own store and socket, so it needs no poll. It carries the dashboard's pop-out title bar. |
| `ErrorNotice` and `reportForError` from the dashboard's components | `ErrorNotice` from `@kirocrew/app-sdk/ui`, with the report the seam returns | The SDK's copy of the same component. |
| `safeSetItem` from `utils/safeStorage`, which frees space by deleting the dashboard's cache entries | `ui/src/utils/safeStorage.ts`, a write that drops itself when storage is full | An app does not own the dashboard's storage, so it never deletes it. The two values it saves are small and safe to lose. |
| Dashboard utility classes (`text-text-strong`, `bg-black/55`, `!text-[#f88]`, ...) | The same rules under an `mc-aw-` prefix (`ui/src/styles.ts`) | A utility class exists only while some dashboard source names it. The theme tokens are the same, so every theme still applies. |
| `ui.pages` `[{"route": "/worlds", "icon": "Gamepad2"}]`, page compiled into the dashboard (`apps/builtinRegistry.ts`) | `ui.entry: "dist/index.mjs"`, `ui.pages` `[{"route": "/apps/agent-worlds", "label": "Worlds"}]`, no `icon` | An installed app ships its page as a bundle AppHost loads. The legacy `/worlds` route and `Gamepad2` glyph of an adopted record come from Kiro Crew's adoption pin, never from this manifest. |
| `iconUrl` / `heroImage*` as absolute `/app-assets/worlds/...` SVGs | `iconPath` / `heroImage*` / `screenshots` as repo-relative PNGs under `assets/` | A registry app's art is repo-relative, and the catalog refuses SVG for a non-builtin source. The PNGs were rendered from the built-in SVGs (the icon at 512×512 on an opaque tile with its `--ico-a` / `--ico-b` tokens set to fixed blue and amber; heroes at 1200×675; detail banners at 1200×288), kept beside them. The store screenshot is the built-in's. |
| The fifth highlight, "Purely a visualization, it never changes what your agents do" | A fifth highlight saying what the message view does (read, reply or steer, approve or deny), in every shipped language | The old line was not true: the page sends messages and decides approvals when the person presses its buttons. |
| App Store copy keys in the dashboard catalogs (`apps.agentWorlds.manifest.*`) | `l10n` block in `app.json`, one entry per shipped non-English locale | The listing copy travels with the app. It is the `manifest` subtree of `ui/i18n/<locale>.json`, kept equal by a test. |
| No `minKiroCrewVersion` | `"minKiroCrewVersion": "0.14.0"` | The first Kiro Crew with `useHostSessions`. On an older host the page says it needs an update instead of failing to load (`ui/src/hostSdk.ts` reads the seam off a namespace import). |
| Em dashes in two strings (the New session sign's title, the unconfirmed-delivery note) | A colon | House style here. |

## Tests

Every built-in test of the page was ported to `ui/tests/`, except the four
`useAgentSync` tests for titles, default-agent labels, recency order and
approval targets: those are the host's now, and Kiro Crew pins them
(`website/src/test/AppSdkHostSessions.test.tsx`). `useAgentSync.host.test.tsx`
pins that the page carries the host's sessions over unchanged. The
interaction tests drive the page against a host double that answers the way
`useHostSessions` does. New tests cover the entry (`entry.test.tsx`) and the
pop-out address (`popoutRoute.test.ts`).

## Synced with the wheel copy

Every change to the built-in since `33979525d8`, up to KiroCrew `main` `2e2503671f`
(its manifest, page, pop-out, scenes, scene hooks, store art, strings and their tests):

| KiroCrew | Built-in change | Here |
|---|---|---|
| #37426 | the wheel copy's manifest declares `permissions.api` for the host paths its page calls | the port's basis: declared here from the start, and `tests/fixtures/builtin-app.json` is that manifest |
| #37549 | the page stops reading the gateway from a hidden tab: the cron and subagent polls and the mini thread's 2-second refresh run only while the page is visible and tick once when it is shown again, and a cron or subagent read is skipped while the previous one is still out; the pop-out's session poll likewise | `ui/src/utils/pollWhileVisible.ts` (the built-in's `lib/pollWhileVisible.ts`), `ui/src/hooks/useAgentSync.ts`, `ui/src/hooks/useSceneInteraction.tsx`, `ui/tests/pollWhileVisible.test.ts`, `ui/tests/useAgentSync.poll.test.tsx`. The pop-out here reads the host's sessions, which needs no poll (What changed, above). |
| #38097 | the collapse toggle of the page and the pop-out draws a lucide chevron instead of a triangle glyph | `ui/src/pages/WorldsPage.tsx`, `ui/src/pages/WorldsPopout.tsx`, the toggle cases |

No string the page shows changed in that range, in any language.
