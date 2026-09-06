# Domain notes — how MSM breeding works

Written so that whoever (or whatever) edits the dataset shares the same vocabulary.
Anything marked **[verify]** must be checked against the game or wiki before it's
treated as fact in `src/data/`.

## Elements

The five **natural elements**: Plant, Cold, Air, Water, Earth.

Every natural monster is defined by the *set* of elements it carries:

- **Single-element** — 1 element (e.g. Mammott = Cold, Potbelly = Plant)
- **Double** — 2 elements
- **Triple** — 3 elements
- **Quad** — 4 elements
- **Quint** — 5 elements

Non-natural element families (Ethereal, Fire, Magical, etc.) exist in the game but are
**out of scope for v1**. The data model leaves room for them; the dataset does not
include them.

## The core breeding rule

Breeding two monsters pools their elements. The possible offspring are the monsters
whose element set is a subset of that pool — in practice, the game produces monsters
whose element set is exactly one of the valid combinations reachable from the pool.

Example: Mammott (Cold) + Potbelly (Plant) → the pool is {Cold, Plant}, so the
possible results are Cold, Plant, or the Cold+Plant double.

Two consequences the app depends on:

1. **Reverse lookup is finite and enumerable.** For a target monster with element set
   `E`, the valid parent pairs are pairs `(a, b)` where `elements(a) ∪ elements(b) == E`
   (with additional exceptions, below).
2. **Multiple pairs produce the same monster — this is the normal case.** A triple can
   usually be made from several different single+double or double+double pairings, and
   a quad from more still. Assume a typical target has roughly 3-8 valid combos, not
   one. The app must show all of them, because the user may only own some of the
   parents, and because a combo the user can't attempt today is still worth seeing.

   Everything downstream follows from this: the combo *list* is the product, the
   many-to-one shape drives the data model, and "which of these should I pick" is the
   question the UI actually has to answer.

## Where the rule breaks

These are the reasons the dataset stores combos explicitly rather than computing them:

- **Single-element monsters can't be bred** from a pair the normal way in most cases;
  they're bought from the market. **[verify]** per monster.
- **Quints and Quads** have restricted or special combos.
- **Shugabush / Shugafam** monsters use fixed, hand-authored combos that ignore the
  element rule entirely.
- **Light Island / Psychic / Faerie / Bone / Sanctum** and other non-classic natural
  islands introduce their own element sets and rules. These are the expensive kind of
  island — see "The cost of an island" below.
- Some monsters are **island-exclusive** even though their element set is valid
  elsewhere.

**Rule: the element math is a sanity check on the data, never a substitute for it.**
The app reads combos from JSON. A test asserts that combos flagged
`followsElementRule` satisfy the union rule.

## Why combos aren't computed

This was considered and rejected. A generator over element sets would be correct for
common naturals and wrong for every category the app is meant to grow into:

- **Epics ignore the element rule entirely**, and the same Epic monster has
  **different combos on different islands**. There is no element math that produces
  these; they're fixed, per-island, hand-authored pairs. *Confirmed:* the wiki's Epic
  Bowgart page states "the combination to breed Epic Bowgart is different for each
  Island", and tags each combo with an island (Plant Island: Clamble + Oaktopus;
  Cold Island: Congle + Furcorn).
- **Rares share their common's combos.** Rare Bowgart "can be bred in the same ways as
  a Common Bowgart" — same three pairs, different odds and availability window.
- **Rares share their common's element set and combos.** The union rule can't
  distinguish "produces Bowgart" from "produces Rare Bowgart", and rare availability
  windows aren't expressible as elements at all.
- **Ethereals** bring non-natural elements and their own inheritance behaviour.
- Even among commons, singles, quads, and quints carry restrictions the union rule
  over-generates against.

A generator that's right for the easy 80% and silently invents combos for the other
20% is worse than no generator: the wrong rows look exactly like the right ones. So
combos are **entered by hand from a verified source**, and the element rule is
demoted to a validator that individual rows can opt out of.

## Islands

A monster lives on zero or more islands. The same monster on two islands has the same
elements and the same combos, but the *available parents* differ, which is exactly why
the island filter matters: a combo is only **attemptable** on island `I` if both
parents are available on `I` and the target itself is available on `I`.

### The cost of an island

Islands are deliberately not enumerated in code (see `docs/DATA-MODEL.md`), so the
cost of adding one depends entirely on whether it plays by the existing rules:

- **Cheap — pure data.** An island whose monsters use the five natural elements and
  the normal union rule. One row in `islands.json`, plus island ids appended to the
  monsters that live there. Start with the five classic naturals plus Shugabush and
  add more whenever it's convenient; there's no reason to decide the full list up
  front.
- **Expensive — needs code.** An island that introduces a **new element** (the element
  union rule, the element pips, and invariant 8 all have to learn about it) or a
  **new breeding rule** that the `(target, parents)` combo shape can't express. This
  is where Ethereal, Magical, Wublin, and Celestial content sits, and it's why they're
  out of v1 — not the volume of data.

**[verify]** which specific islands fall on which side of that line. Gold Island and
Light Island are the immediate ambiguous cases; check their element sets before adding
them and treat any surprise as the expensive kind until proven otherwise.

## Vocabulary used in code and docs

| Term | Meaning |
| --- | --- |
| **monster** | A breedable creature, identified by a stable slug |
| **element** | One of the five natural elements |
| **combo** | An unordered pair of parent monsters that can produce a target |
| **target** | The monster the user is trying to breed |
| **island** | A world the user plays on; scopes availability |
| **attemptable** | A combo whose parents and target are all on the active island |
| **pinned target** | The monster the user is currently chasing, saved per island |
