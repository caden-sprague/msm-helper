# MsmHelper

A phone-first My Singing Monsters breeding helper. The whole point is to answer one
question fast, with no ads and no wiki clutter:

> "I'm on **this island** and I want **this monster** — what do I breed?"

Plus: remember what the user was working toward, per island, so they never have to
write it down.

## Decisions already made

| Decision | Choice |
| --- | --- |
| Platform | Installable PWA — React + Vite + TypeScript, static host |
| Data | Hand-curated JSON checked into the repo, no backend |
| Combos | Entered by hand, never computed — the element rule is a validator only |
| v1 scope | Natural islands, common monsters only; schema ready for rare/epic/ethereal |
| Persistence | `localStorage`, per-island "currently breeding" state |

## Docs

- `docs/PRD.md` — what the app does, user stories, what's out of scope
- `docs/DOMAIN.md` — MSM breeding rules and vocabulary (read before touching data)
- `docs/DATA-MODEL.md` — JSON schemas for monsters/islands/combos, invariants
- `docs/DATA-CONTRIBUTION.md` — **read this before adding island data**
- `docs/ARCHITECTURE.md` — stack, file layout, state, caching, offline

## Working agreements

- **No backend.** If a feature needs a server, it's out of scope for v1.
- **Offline is a requirement, not a nice-to-have.** The user plays on a phone,
  possibly on bad signal. Every lookup must work with the network off.
- **Mobile-first CSS.** Design at 390px wide. Desktop is a bonus.
- **Data is validated, not trusted.** Any change to `src/data/*.json` must pass the
  invariant checks in `docs/DATA-MODEL.md` (enforced by a test, not by eyeballing).
- Don't add a dependency for something the platform already does.
- **Prefer explicit data over clever derivation.** The game breaks its own rules often
  enough that generated data would be confidently wrong; a wrong row that looks right
  is the worst outcome here.
