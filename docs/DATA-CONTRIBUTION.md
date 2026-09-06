# Adding island data

Written for anyone — human or agent — extracting monster data from the wiki. Follow
this exactly and `npm test` will pass; deviate and it will tell you where.

**Validate with `npm test` before handing work over.** 18 invariants run against the
JSON; a green run is the definition of done. Don't edit tests to make data pass.

Three of them exist specifically to catch *omissions*, which are the failure mode that
doesn't announce itself — extraction succeeds, data looks fine, and a player finds the
hole later:

- **16** — every common has a `rare-` and `epic-` sibling, or is in `NO_VARIANTS`.
- **17** — a natural island has exactly one common Natural monster per non-empty
  subset of its elements (4 elements -> 15 monsters). A missed or misnamed double
  fails here.
- **18** — every non-buyable monster has at least one combo actually attemptable on
  each island it appears on. Catches island-specific combos that were never extracted.

They are only as good as their exceptions: if a monster legitimately breaks one, add it
to the documented list with a reason, don't loosen the rule.

## Adding an island

```bash
python3 scripts/build_island.py "Air Island" air '#c9d94a' 3
npm test
```

It reads the island page for its element set and specials, works out the roster from
the 30 Natural monsters' own island lists rather than a hand-written list, and pulls
each monster plus its Rare and Epic variants. It's idempotent: existing monsters gain
the island, existing combos are left alone.

Then read the invariant failures. They are the review.

## Tooling

`scripts/wiki.py` has the extraction helpers used for Plant and Cold: `fetch`,
`elements_of`, `breeding_time`, `rendered_breeding_time`, `combo_section`, `combos_in`,
`ranking`, `slug`, `iso`. It is a one-off authoring tool, not part of the build — data
is extracted once and committed.

`combo_section(content, island_name)` takes the island being extracted so it can cut at
prose about *other* islands without discarding sections that open with "On [[This
Island]], ...".

## Where the data comes from

The rendered wiki returns 403 to scripted requests, and the `Breeding_Combinations`
overview hides combos behind `{{ComboLookup}}` templates. Use the MediaWiki API and read
the **per-monster pages**:

```bash
curl -sG \
  --data-urlencode "titles=Bowgart|Maw|T-Rox" \
  --data "action=query&prop=revisions&rvprop=content&rvslots=main&format=json&formatversion=2" \
  -A "MsmHelperResearch/0.1" \
  "https://mysingingmonsters.fandom.com/api.php"
```

Each page gives you everything needed:

| Field | Where it lives |
| --- | --- |
| `elements` | `\|element1 = Plant`, `\|element2 = Water`, … in the infobox |
| `islands` | `\|island(s) = {{IslandsList\|Plant Island\|Cold Island\|…}}` |
| `breedingTime` | the `Breeding/Incubation Time` infobox table, `Default:` column — also in prose: "By default, its breeding time is 12 hours long". Market-bought singles have one too; it's the hatch time for a breeding-failure egg |
| `buyable` | prose: "must be purchased in the [[Market]]" |
| combos | `==Breeding==` section: `{{BreedingCombo\|A\|B}}` and `{{BreedingCombo/Entry\|A\|B}}` |
| `rank` / `advice` | `:''Of these, [[A]] + [[B]] is the best combination, as …''` |

## Rules that are easy to get wrong

1. **Stop parsing the `==Breeding==` section** at any of: `breeding failure`,
   `failed breeding`, `Used in Breeding`, `Rare version of any Monster`,
   `can also be bred in`. Everything after those describes failure outcomes and rare
   substitutions, not combos a player would set up. This is how `rare-entbrat` once
   leaked into the data.
2. **Only enter combos the wiki actually lists.** Do not enumerate every
   element-valid pair. The element rule says what's *possible*; the wiki says what's
   *useful*. Entbrat has 25 possible pairings and 7 real ones.
3. **`parents` must be sorted alphabetically** by id — it's how duplicates are
   detected.
4. **Ids are kebab-case slugs** of the display name: `Toe Jammer` -> `toe-jammer`,
   `T-Rox` -> `t-rox`.
5. **Elements go in canonical order**: plant, cold, air, water, earth — the order in
   `elements.json`, not the order the infobox happens to list them.
6. **`verified: true` means a human or a cited source confirmed the row.** Wiki-sourced
   rows count. Rows entered from memory do not.
7. **Adding an island** also needs a line in `IslandId` in `src/data/types.ts`, a row in
   `islands.json` with its `elements` array, and monsters tagged with its id. A monster
   can only live on an island that has all of its elements (invariant 14).

## Ranking

The wiki names a best combo and usually a runner-up, with reasoning about what happens
when the breed *fails*:

```
:''Of these, [[Furcorn]] + [[Toe Jammer]] is the best combination, as failing and
breeding a Toe Jammer lets you retry the combo almost instantly. [[Maw]] + [[Potbelly]]
is a close second, because it has low average times in case of failure.''
```

becomes:

```json
{ "target": "bowgart", "parents": ["furcorn", "toe-jammer"], "followsElementRule": true,
  "rank": 1, "advice": "Failing and breeding a Toe Jammer lets you retry the combo almost instantly",
  "verified": true }
```

- `rank`: 1 for "the best combination", 2 for "a close second". Nothing else gets a rank.
- `advice`: the reason clause with wiki markup stripped, leading "as"/"because" removed,
  first letter capitalised, no trailing period.
- Ranks must be unique per target and start at 1. Never rank a target that has only one
  combo.

## Don't forget the specials' variants

The natural monsters are easy to remember; the island's **specials** (Ethereal,
Seasonal, Legendary, Mythical, Wubbox, Werdos) need Rare and Epic extraction too. Cold
Island shipped without them because the naturals and the specials were extracted by
two different passes and only the first fetched variants.

Invariant 16 now catches this: every common must have a `rare-` and an `epic-` sibling
unless it's in the `NO_VARIANTS` list in `src/lib/data.test.ts`. Add to that list only
after checking the wiki page really doesn't exist — currently bbli$zard, Maggpi,
Parlsona, Shugabush and Tawkerr (all Legendary or Werdo).

## Rare and Epic monsters

Entered for Plant Island. The rules, now that they've been exercised once:

- Rares are **separate monster rows** with `rarity: "rare"` and `variantOf` pointing at
  the common. They have their own breeding times.
- **Rare doubles/triples/quads reuse the common's combos verbatim**, and those
  *do* satisfy the element rule — the parents are the same, and the Rare carries the
  same elements. Keep `followsElementRule: true`.
- **Rare single-elementals are the exception.** They're bred from two Triples that share
  the Rare's element, so the parents carry more elements than the target. The wiki lists
  three eligible Triples per island; the combos are the three pairs from that set.
  `followsElementRule: false` plus a `note`.
- Epics have **different combos on different islands** — the wiki states this outright.
  Each is its own combo row with an explicit single-island `islands` value
  (invariant 13), and they break the element rule (`note` required).
- **Non-Natural classes** (Ethereal, Mythical, Seasonal, Legendary) break the element
  rule too: they're bred from Natural parents, so nothing carries the target's element.

### Parsing gotcha: template runs

Don't assume the `==Breeding==` section's combos are one contiguous run of templates.
Rare Entbrat splits its seven into two runs (three double+double, then four
triple+single) separated by a prose line, and a "first run only" parser silently drops
four of them. Read every run before the stop-phrases in the rules above, and treat a run
tagged `island=` as scoped to that island only.

## Monsters that aren't bred at all

Some island residents have no `==Breeding==` section, because they're bought:
Tawkerr and Parlsona (100 Relics each), and the whole Wubbox family. Mark them
`buyable: true` and give them no combo rows — invariant 10 only demands combos for
non-buyable monsters.

**Dipsters are deliberately excluded.** The island roster lists `Dipsters`,
`Elemental Dipsters` and `Royal Dipsters`, but each is a *group* of many monsters
(Do, Re, Mi, …) rather than one monster, and they're bought with Keys, so there is no
combo to record. Entering them as three single rows would be a wrong row that looks
right. They need their own grouping concept in the schema first.
