# Adding island data

Written for anyone — human or agent — extracting monster data from the wiki. Follow
this exactly and `npm test` will pass; deviate and it will tell you where.

**Validate with `npm test` before handing work over.** 15 invariants run against the
JSON; a green run is the definition of done. Don't edit tests to make data pass.

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
| `breedingTime` | prose: "By default, its breeding time is 12 hours long" |
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
6. **Omit unknown values, never guess them.** Single-element monsters have no
   published breeding time; leave `breedingTime` out rather than inventing one.
7. **`verified: true` means a human or a cited source confirmed the row.** Wiki-sourced
   rows count. Rows entered from memory do not.
8. **Adding an island** also needs a line in `IslandId` in `src/data/types.ts`, a row in
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

## Rare and Epic monsters

Not yet entered, but the schema is ready. When you get there:

- Rares are **separate monster rows** with `rarity: "rare"` and `variantOf` pointing at
  the common. They share the common's combos but have their own breeding times.
- Epics have **different combos on different islands** — the wiki states this outright.
  Each is its own combo row with an explicit single-island `islands` value
  (invariant 13).
- Both break the element rule. Set `followsElementRule: false` and write a `note`
  explaining why (invariant 9).
