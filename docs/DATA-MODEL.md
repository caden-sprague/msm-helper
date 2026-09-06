# Data model

All game data is static JSON committed to the repo under `src/data/`, imported at
build time, and typed by interfaces in `src/data/types.ts`. There is no runtime
fetch and no backend.

## Files

```
src/data/
  elements.json   # the 5 natural elements
  islands.json    # islands and which monsters live there
  monsters.json   # monsters, their elements, times
  combos.json     # parent pairs -> target
  types.ts        # TypeScript interfaces mirroring the above
```

Splitting islands out of `monsters.json` keeps monster records stable when island
availability changes, and keeps diffs readable.

## Schemas

### Element

```ts
// v1 populates naturals only, but the union is open for later families.
type ElementId =
  | 'plant' | 'cold' | 'air' | 'water' | 'earth'          // natural
  | 'crystal' | 'fire' | 'plasma' | 'shadow' | 'mech'     // ethereal  [verify]
  | 'poison' | 'light' | 'psychic' | 'faerie' | 'bone';   // other     [verify]

type ElementFamily = 'natural' | 'ethereal' | 'other';

interface Element {
  id: ElementId;
  name: string;           // "Plant"
  family: ElementFamily;  // gates which breeding rules apply
  color: string;          // hex, used for element pips in the UI
}
```

`family` exists so that logic and validation can ask "is this a natural-element
monster?" without hardcoding a list of five ids in five places.

### Monster

```ts
type Rarity = 'common' | 'rare' | 'epic';

interface Monster {
  id: string;              // stable kebab-case slug: "bowgart", "rare-bowgart"
  name: string;            // display name: "Rare Bowgart"
  rarity: Rarity;          // v1 data is all 'common'; the field is required anyway
  variantOf?: string;      // Monster.id of the common form, for rare/epic
  elements: ElementId[];   // sorted in canonical element order
  islands: IslandId[];     // islands this monster can live on
  breedingTime?: string;   // ISO 8601 duration, e.g. "PT8H"; omit when unknown
  buyable: boolean;        // available in the market without breeding
  icon?: string;           // filename in /public/icons, omit until art exists
  verified: boolean;       // a human has checked this row against the game
}
```

`rarity` is **required from day one**, even though every v1 row is `'common'`. Adding a
required field to hundreds of existing rows later is the expensive kind of migration;
writing `"rarity": "common"` now costs nothing.

`variantOf` links Rare/Epic Bowgart back to Bowgart, so search can group variants and
the detail view can offer "show the rare version" without string-matching on names.

`breedingTime` is stored as an ISO 8601 duration so it sorts and parses without a
custom format, and is rendered as "8h" in the UI. It is **optional**: an unknown time
is left out rather than guessed, and unknown times sort last in the combo list instead
of masquerading as instant.

`verified` is the honesty flag. It means a human has checked the row against the game
or a trusted source — not that it passed the tests. Seeded rows start `false`. The
tests report the unverified count without failing on it; see `docs/DATA-STATUS.md`.

### Island

```ts
// A literal union, hand-maintained. Adding an island is two lines: one here,
// one row in islands.json.
type IslandId =
  | 'plant' | 'cold' | 'air' | 'water' | 'earth' | 'shugabush';

interface Island {
  id: IslandId;
  name: string;         // "Plant Island"
  order: number;        // display order in the island selector
  color: string;        // hex, used for island theming
  elements: ElementId[]; // which elements exist here; not every island has all five
}
```

Monster→island membership lives on `Monster.islands`, not on the island record. One
direction only; the reverse index is built in memory at startup.

**Islands are open-ended in behaviour, typed by hand.** No component enumerates
islands: the selector, the filter, and the theming all iterate `islands.json`. But
`IslandId` stays a literal union rather than `string`, because that's what makes a
typo in `Monster.islands` a compile error instead of a monster that silently never
appears on any island.

Deriving the union from the JSON (`(typeof islands)[number]['id']`) does **not** work
with a plain `resolveJsonModule` import — TypeScript widens JSON string fields to
`string`, so the derived type collapses to `string` and buys nothing. Getting literal
types would mean moving the data into a `.ts` file with `as const`. Not worth it for a
one-line-per-island union.

So adding an island that reuses the five natural elements is: one line in `types.ts`,
one row in `islands.json`, and the island's id appended to `Monster.islands` for each
monster that lives there. No new logic, no new tests.

The cost only rises when an island brings something *structural* with it — a new
element, or a rule the union check in invariant 8 can't express (see
`docs/DOMAIN.md`). Those need code, not just rows.

### Combo

```ts
interface Combo {
  target: string;              // Monster.id
  parents: [string, string];   // Monster.ids, sorted alphabetically
  islands?: IslandId[];        // omit = every island where all three exist
  followsElementRule: boolean; // false = hand-authored exception, skips invariant 8
  note?: string;               // required when followsElementRule is false
  rank?: number;               // wiki's ranking: 1 = best, 2 = close second
  advice?: string;             // the wiki's reasoning for that rank
  verified: boolean;           // a human has confirmed this combo works
}
```

`parents` is an unordered pair, but is **stored sorted alphabetically** so that
duplicates are detectable by string comparison and diffs are stable.

`islands` is absent for most common-monster combos, where attemptability is derived
from availability. It becomes **load-bearing** for Epics: the same Epic monster has
different parent pairs on different islands, so each of those is a separate `Combo`
row with an explicit single-island `islands` value. Confirmed against the wiki — see
`docs/DOMAIN.md`. The shape already supports this; no schema change when Epics land.

`rank` and `advice` capture the wiki's editorial judgement — *"Of these, Furcorn + Toe
Jammer is the best combination, as failing and breeding a Toe Jammer lets you retry the
combo almost instantly"*. This is reasoning about **failure outcomes and retry speed**,
which breeding times alone can't express, so it's recorded rather than computed. Ranked
combos sort above unranked ones; unranked combos fall back to cheapest-first.

`followsElementRule` is an explicit flag rather than something inferred from the
presence of `note`. An exception should be a deliberate assertion by whoever entered
the row, not a side effect of having written a comment.

**Combos are many-to-one against a target.** `combos.json` is a flat array and a
target appears in as many rows as it has parent pairs — typically 3-8. Never model a
target as having *the* combo: there is no `Monster.combo` field, and every lookup
returns an array. Invariant 9 only asserts *at least* one combo exists; a monster with
exactly one is the unusual case worth a second look.

## Derived indexes (built once at app start, not stored)

- `combosByTarget: Map<monsterId, Combo[]>` — powers reverse lookup; values are lists
  of typically 3-8 combos, pre-sorted cheapest-first at build time
- `combosByParent: Map<monsterId, Combo[]>` — powers forward lookup
- `monstersByIsland: Map<islandId, Monster[]>` — powers the island filter
- `monstersById: Map<monsterId, Monster>`

The full dataset for v1 is small (low hundreds of records). Building these eagerly on
load is cheaper than any lazy scheme and keeps lookups O(1).

## Invariants — enforced by a test, not by review

1. Every `Monster.id` is unique and matches `/^[a-z0-9]+(-[a-z0-9]+)*$/`.
2. Every id referenced in `Combo.target` and `Combo.parents` exists in `monsters.json`.
3. Every `IslandId` referenced anywhere exists in `islands.json`.
4. Every `ElementId` referenced anywhere exists in `elements.json`.
5. `Monster.elements` is non-empty, has no duplicates, and is in canonical order.
6. `Combo.parents` is sorted alphabetically.
7. No two combos share the same `(target, parents)` pair.
8. If `followsElementRule` is true, the union of the parents' elements equals the
   target's elements (see `docs/DOMAIN.md`).
9. If `followsElementRule` is false, `note` is present and non-empty.
10. Every non-`buyable` monster has at least one combo producing it.
11. Every monster belongs to at least one island.
12. `rarity: 'common'` monsters have no `variantOf`; `'rare'`/`'epic'` monsters have a
    `variantOf` that resolves to an existing `rarity: 'common'` monster.
13. Every combo whose target is an Epic has an explicit `islands` value.
14. A monster only lives on islands that contain all of its elements.
15. `rank` is a positive integer, unique per target, starts at 1, and only appears on
    targets with more than one combo. `advice` never appears without `rank`.

Invariant 14 is the one that pays for `Island.elements`: Plant Island has no Air, so
an Air monster accidentally tagged `"plant"` fails the build rather than showing up as
an unbreedable ghost in the island filter.

Invariant 8 is the important one for common naturals: it catches most data-entry
mistakes for free. It is deliberately opt-out rather than universal, because the
monsters worth adding next are precisely the ones that break it.

## Adding a monster — checklist

1. Add the record to `monsters.json` with rarity, elements, islands, breeding time.
2. Add every combo that produces it to `combos.json`, parents sorted.
3. Set `followsElementRule` honestly per combo. If it's false, write a `note` saying
   why — an unexplained exception is a bug until proven otherwise.
4. Run the data tests. Fix what they flag.

Every combo is entered by hand from a verified source. **Nothing in this pipeline
computes combos** — see "Why combos aren't computed" in `docs/DOMAIN.md`.
