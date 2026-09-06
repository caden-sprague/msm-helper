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

## Known gap: single-element breeding times

The four singles (Potbelly, Mammott, Toe Jammer, Noggin) have **no published breeding
time** — they're market-bought, so the wiki lists no value.

This currently breaks the combo sort in a way that matters. Cost is the sum of the
parents' times, and unknown sorts last, so **single+double combos sort to the bottom** —
but those are exactly the ones the wiki recommends. For Bowgart, the wiki's best pick
(Furcorn + Toe Jammer, "failing and breeding a Toe Jammer lets you retry almost
instantly") currently ranks last.

Two ways out, needs a decision:

1. Fill in the singles' real breeding times from the game (they're seconds-to-minutes),
   after which the existing cost sort produces the wiki's own ranking for free.
2. Change the ranking to prefer combos containing a cheap parent, rather than summing.

Option 1 is better if the numbers are easy to read off in-game.

## Not yet done

- Other islands: Cold, Air, Water, Earth, Shugabush.
- Rare/Epic variants (schema supports them; no data entered).
- Monster icons. `Monster.icon` is unused; the UI shows names and element pips only.
  App icons exist but are a placeholder "M" mark, not artwork.
