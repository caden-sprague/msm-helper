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

## Docs

Start with [CLAUDE.md](CLAUDE.md) for the decisions, then:

- [docs/PRD.md](docs/PRD.md) — what it does and doesn't do
- [docs/DOMAIN.md](docs/DOMAIN.md) — MSM breeding rules; read before touching data
- [docs/DATA-MODEL.md](docs/DATA-MODEL.md) — JSON schemas and the invariants tests enforce
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — stack, state, offline, persistence
- [docs/DATA-STATUS.md](docs/DATA-STATUS.md) — what's verified and what's missing

Current data coverage: **Plant Island commons only** (15 monsters, 25 combos), sourced
from the MSM wiki.
