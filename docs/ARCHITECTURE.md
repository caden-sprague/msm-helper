# Architecture

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Language | TypeScript | The data invariants are worth having the compiler check |
| Build | Vite | Fast, first-class PWA plugin, zero-config static output |
| UI | React 18 | Familiar, small app, no need for anything exotic |
| Routing | React Router (hash or browser) | Two or three views; deep links are useful |
| Styling | CSS Modules or plain CSS with custom properties | No design system needed for one screen |
| Offline | `vite-plugin-pwa` (Workbox) | Precaches the whole app; the dataset is part of the bundle |
| Storage | `localStorage` | Tiny, synchronous, survives app restarts |
| Hosting | Any static host (Vercel / Netlify / GH Pages) | No server, no cost |
| Tests | Vitest | Data invariants + lookup logic |

No state library. The app has one piece of global state (see below) and it fits in a
single React context.

## Layout

```
src/
  data/            # static JSON + types (see docs/DATA-MODEL.md)
  lib/
    indexes.ts     # builds the derived Maps once at startup
    lookup.ts      # reverseLookup(), forwardLookup(), attemptability filtering
    search.ts      # fuzzy monster-name search
    storage.ts     # the ONLY module that touches localStorage
  state/
    AppState.tsx   # context: active island + per-island pinned target
  components/      # IslandSelector, MonsterSearch, ComboCard, ElementPips, ...
  routes/          # Home, MonsterDetail, ForwardLookup
public/
  icons/           # monster icons, manifest icons
```

Rule: `lib/` is pure and free of React. Every lookup function is a pure function of
`(data, args)`, which makes it trivially testable without rendering anything.

## State

Exactly two things are global:

```ts
interface AppState {
  activeIsland: IslandId;
  pinnedTargets: Record<IslandId, string | null>;  // island -> monster id
}
```

Everything else (search text, expanded cards, toggles) is local component state and is
deliberately **not** persisted — restoring a half-typed search string is noise, not a
feature.

## Persistence

One key, one JSON blob, versioned:

```ts
// localStorage key: "msmhelper.state.v1"
{
  "version": 1,
  "activeIsland": "plant",
  "pinnedTargets": { "plant": "bowgart", "cold": "quibble" },
  "updatedAt": "2026-09-06T12:00:00.000Z"
}
```

Rules for `lib/storage.ts`:

- **Write on every state change**, debounced ~300ms. The user closes the app by
  switching apps; there is no "save" moment and no reliable unload event on mobile.
- **Reads are defensive.** Missing key, malformed JSON, wrong `version`, an island or
  monster id that no longer exists in the dataset — every one of these falls back to
  defaults rather than throwing. Stale ids are dropped silently on load.
- **Bump `version` and write a migration** when the shape changes. Never silently
  reinterpret an old blob.
- `localStorage` is used over cookies (never sent to a server, larger quota,
  simpler API) and over IndexedDB (the payload is a few hundred bytes).

If Safari evicts the data after long disuse, the app opens on defaults. That's an
acceptable failure mode; nothing is lost that can't be re-selected in two taps.

## Offline & install

- The dataset is imported as ES modules, so it ships **inside the JS bundle** — no
  separate fetch to cache, no cache-vs-network race.
- `vite-plugin-pwa` in `generateSW` mode precaches the app shell and all assets.
- Update strategy: `autoUpdate`, with a small "new version available" toast rather
  than a silent swap mid-use.
- `manifest.webmanifest`: `display: "standalone"`, portrait, maskable icon, theme
  color matching the active island's color where possible.
- Island theming reads `Island.color` from the data; no island names in CSS.
- Acceptance test for every release: load once, enable airplane mode, force-quit,
  relaunch from the home screen — full search and lookup must still work.

## Lookup logic

```ts
reverseLookup(target: MonsterId, island: IslandId | 'all'): Combo[]
```

1. `combosByTarget.get(target)` — all combos, regardless of island.
2. If an island is active, partition into **attemptable** (target and both parents
   available on that island, and the combo's own `islands` allows it) and **elsewhere**.
3. Return attemptable first; the UI hides `elsewhere` behind the "show all islands"
   toggle rather than dropping it, so the user can tell the difference between "no such
   combo" and "not here".

Both partitions are lists, and both are routinely non-trivial in length — a target
with 3-8 combos split across the two buckets is typical. The return type is always
`Combo[]`; no code path may assume a single result or silently take the first one.

Sort attemptable combos by the sum of the parents' breeding times ascending, so the
cheapest attempt is first. This is the confirmed default ordering. Combos with an
unknown parent time sort **last** — an absent time is not treated as zero.

## Performance

The dataset is small enough that none of this needs optimizing. Do not add
virtualization, memo caches, or lazy loading until a real measurement says otherwise.
Cold launch on a mid-range phone should be well under a second; if it isn't, the
bundle has picked up a dependency it doesn't need.

## Visual checks

`npm run shot` drives the dev server in real Chrome at 390x844 (via `puppeteer-core`
against the installed browser — no bundled Chromium download) and writes screenshots to
`.screens/`, which is gitignored. It also asserts the page has no horizontal overflow
and captures light mode, because both are easy to break and invisible in unit tests.

The dev server must already be running.

## Accessibility & mobile ergonomics

- Tap targets 44px minimum. The user is playing one-handed.
- Element and island colors are never the *only* signal — always pair with a label or
  icon. Several MSM element colors are close together.
- Respect `prefers-color-scheme`; the game is often played in the dark.
