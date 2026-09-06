# PRD — MsmHelper

## Problem

MSM wikis are desktop-shaped: dense tables, ads, navigation chrome, and every variant
of a monster on one page. On a phone, mid-game, finding "what two monsters make a
Bowgart on Plant Island" takes far too many taps and too much squinting.

Second problem: breeding takes real time (hours). By the time the timer is done, the
player has forgotten which combo they were attempting, or which monster they were
chasing on which island.

## Users

One user profile: a phone player, mid-game, who knows the game's vocabulary already.
No onboarding, no tutorials, no explanation of what an "element" is.

## Core user stories

1. **Reverse lookup.** As a player, I search for a monster and immediately see the
   breeding pairs that produce it, so I can go set the breeding structure.
2. **Island filter.** As a player, I set my current island once, and every combo shown
   uses only monsters that exist on that island — no combo I can't actually attempt.
3. **Persistence.** As a player, I close the app, come back tomorrow, and it opens on
   the island I was on, showing the monster I was trying to breed.
4. **Per-island memory.** As a player, I switch from Plant Island to Cold Island and
   back, and each island remembers its own in-progress target independently.
5. **Forward lookup (secondary).** As a player, I pick two monsters and see what they
   can produce, so I can tell whether an in-progress breed is worth cancelling.

## v1 feature list

- **Monster search** — type-ahead over monster names, fuzzy enough to survive typos
  and partial names. Results are tappable.
- **Monster detail** — for the selected monster: its elements, which islands it lives
  on, breeding time, and the list of combos that produce it.
- **Combo list** — the core view. A target typically has several valid combos (assume
  3-8, sometimes more), so this is a ranked list, not a single answer. Each row is a
  pair of monsters with names and icons. Rows are ordered cheapest-first by combined
  parent breeding time. Combos that aren't attemptable on the active island are
  collapsed below the attemptable ones behind a "show all islands" toggle, so the user
  can still tell "no such combo" apart from "not here".
- **Island selector** — persistent, always visible, one tap to change.
- **"Currently breeding" pin** — the selected target monster is pinned per island and
  restored on launch. Explicitly clearable.
- **Offline** — full app and dataset cached; works in airplane mode after first visit.
- **Installable** — home screen icon, standalone display, no browser chrome.

## Explicitly out of scope for v1

- Rare, Epic, Seasonal, Wublin, Celestial, Ethereal, Magical, Mythical monsters —
  out of scope as *data*, but the schema is built to accept them without a migration
  (see `docs/DATA-MODEL.md`)
- Breeding odds / success percentages
- Timers, notifications, or anything that counts down
- Accounts, sync across devices, sharing
- Coin/food/level math, income optimization
- A backend of any kind

## Success criteria

- From cold launch to "I know what to breed" in **under 5 seconds and 3 taps**.
- A monster with 8 combos is as readable on a 390px screen as one with 2 — the list
  must stay scannable without scrolling past the useful options.
- Works with the network disabled.
- Reopening the app after a day restores the exact prior view without any user input.

## Open questions

- Do combos need to show breeding time, or is the target monster's time enough?
- When a target has many combos, is cheapest-first enough, or should rarely-useful
  ones (e.g. requiring a quad parent) be de-emphasized rather than just sorted last?
- Should "show all islands" reveal *where* the combo works, or just that it exists?
- Is a favorites/wishlist list needed, or is one pinned target per island sufficient?
