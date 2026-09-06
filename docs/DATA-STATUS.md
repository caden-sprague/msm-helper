# Data status

Tracks what has been checked against a source. Every row in `src/data/` has a
`verified` flag; this file is the human-readable summary.

**Plant Island: verified — 15/15 monsters, 25/25 combos.**

## Source

The MSM Fandom wiki, read through the MediaWiki API rather than the website:

```
https://mysingingmonsters.fandom.com/api.php?action=query&prop=revisions
  &rvprop=content&rvslots=main&format=json&formatversion=2&titles=Bowgart|Maw|...
```

The rendered HTML pages return **403** to scripted requests, and `Breeding_Combinations`
hides its combos behind `{{ComboLookup}}` templates. The per-monster pages carry the
real data: `|element1..4` in the infobox, `breeding time is N hours` in the prose, and
the `==Breeding==` section listing combos as `{{BreedingCombo|A|B}}`.

Data was extracted once and committed. There is no scraper in the build — see
`docs/DOMAIN.md`.

## Cross-check: community breeding guide

`docs/breeding_pdfs/plant/` holds three infographics (commons, Rares, Epics) from a
community "Ultimate Breeding Guide". They are **icon-only — no monster names** — so
they can't be used to identify monsters, but the breeding times are legible and act as
an independent check on the wiki data.

The commons sheet lists exactly 11 breedable monsters at 3 x 30m, 4 x 8h, 3 x 12h, and
1 x 1d. That matches the wiki-sourced dataset row for row. Its remaining entries
(Punkleton at 18h, plus 1d 12h / 18h / 1d 11h results) are Seasonal and Legendary
monsters, out of v1 scope.

The Rares and Epics sheets confirm both carry their own breeding times, distinct from
the commons — more evidence that they need their own rows rather than a flag on the
common.

## Corrections the wiki forced

The hand-seeded guesses were wrong in exactly the places flagged as low confidence:

| Was | Actually | Note |
| --- | --- | --- |
| Quibble (Cold+Water) on Plant Island | **Maw** (Cold+Water) | Quibble is Air+Water and isn't on Plant Island at all |
| Spunge (Cold+Water+Earth) on Plant Island | **T-Rox** (Cold+Water+Earth) | Spunge is Plant+Air+Water, not a Plant Island monster |
| — | **Maw**, **T-Rox** were missing entirely | |

Everything else held: the four-element model (Plant/Cold/Water/Earth, no Air), the
15-monster structure, and the element assignments for the other 13 monsters.

## Combos: 25, not 55

The enumerated seed produced 55 element-valid combos. The wiki lists **25** that
players actually use — it deliberately omits pairings that are valid but pointless.
Entbrat went from 25 enumerated to 7 real ones (3 double+double, 4 triple+single).

This is the concrete version of the earlier decision: the element rule tells you what
is *possible*, the wiki tells you what is *useful*, and only the second is worth
showing. Combos listed only as breeding-*failure* outcomes, and the "substitute the
Rare version" advice, are excluded — an invariant test caught `rare-entbrat` leaking in
from that section.

## Resolved: single-element breeding times

The four singles (Potbelly 2h, Mammott 2m, Toe Jammer 1m, Noggin 5s) **do** have a
published time — the `Breeding/Incubation Time` infobox table on each wiki page. It's
the hatch time for an egg you get from a failed breed, not a combo time, which is why
it was first read as "not published".

Filling them in was option 1 of the two recorded here, and it resolved the sort problem
without a code change. No combo has an `undefined` cost any more, so the cost tie-break
in `byRankThenCost` does real work instead of dumping every single-parent combo at the
bottom of the list.

Note what this does *not* do: it doesn't reproduce the wiki's ranking. Cost is the sum
of both parents' times, and the wiki ranks on what happens when a breed *fails* — those
disagree. Bowgart's best pick, Furcorn + Toe Jammer, costs 8h 1m; the runner-up Maw +
Potbelly costs 2h 30m. Sorting by cost alone would invert them. The explicit `rank`
is what puts them in the wiki's order; cost only orders the unranked remainder.

## Not yet done

- Other islands: Cold, Air, Water, Earth, Shugabush. Note that many rows already in
  the dataset list combos for those islands on the wiki; only the Plant Island
  combination was taken.
- Dipsters (3 group entries on the Plant Island roster) — see DATA-CONTRIBUTION.md for
  why they're excluded rather than guessed at.
- Monster icons. `Monster.icon` is unused; the UI shows names and element pips only.
  App icons exist but are a placeholder "M" mark, not artwork.
