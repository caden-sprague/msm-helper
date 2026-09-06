# MSM Helper

A phone-first My Singing Monsters breeding lookup. Search a monster, see what breeds
it on the island you're playing, and have it still be there next time you open the app.

```bash
npm install
npm run dev            # http://localhost:5173
npm run dev -- --host  # reachable from your phone on the same Wi-Fi
npm test               # data invariants + lookup + UI
npm run build          # static output in dist/
```

Install and offline need a secure context, so they only work on `localhost` or a
deployed HTTPS URL — not over a LAN IP.

## Deploying

Pushes to `main` build and publish to GitHub Pages via `.github/workflows/deploy.yml`.
The data invariants run first, so bad data can't reach the phone.

Pages serves from `/<repo>/`, so the build takes a `BASE_PATH`. To check a
Pages-shaped build locally:

```bash
npm run check:build   # builds under /msm-helper/ and verifies it in a real browser
```

That catches the usual subpath failures: absolute asset URLs, a service worker whose
scope doesn't match, and an unreachable manifest.

## Credits

Monster data comes from the [My Singing Monsters Wiki](https://mysingingmonsters.fandom.com),
licensed [CC BY-SA](https://www.fandom.com/licensing). My Singing Monsters is a
trademark of Big Blue Bubble; this is an unaffiliated fan project and ships no game
artwork.

## Docs

Start with [CLAUDE.md](CLAUDE.md) for the decisions, then:

- [docs/PRD.md](docs/PRD.md) — what it does and doesn't do
- [docs/DOMAIN.md](docs/DOMAIN.md) — MSM breeding rules; read before touching data
- [docs/DATA-MODEL.md](docs/DATA-MODEL.md) — JSON schemas and the invariants tests enforce
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — stack, state, offline, persistence
- [docs/DATA-CONTRIBUTION.md](docs/DATA-CONTRIBUTION.md) — how to add an island's data
- [docs/DATA-STATUS.md](docs/DATA-STATUS.md) — what's verified and what's missing

Current data coverage: **Plant Island commons only** (15 monsters, 25 combos), sourced
from the MSM wiki.
