import { describe, expect, it } from 'vitest';
import { combos, elements, islands, monsters } from '../data';
import { elementOrder } from './indexes';

// The invariants from docs/DATA-MODEL.md. These are the safety net for hand-entered
// data — if one of these fails, the dataset is wrong, not the test.

const monsterIds = new Set(monsters.map((m) => m.id));
const islandIds = new Set(islands.map((i) => i.id));
const elementIds = new Set(elements.map((e) => e.id));
const elementsOf = new Map(monsters.map((m) => [m.id, new Set(m.elements)]));

describe('monsters', () => {
  it('1. have unique, kebab-case ids', () => {
    expect(monsterIds.size).toBe(monsters.length);
    for (const m of monsters) expect(m.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('5. have non-empty, duplicate-free elements in canonical order', () => {
    for (const m of monsters) {
      expect(m.elements.length, m.id).toBeGreaterThan(0);
      expect(new Set(m.elements).size, m.id).toBe(m.elements.length);
      const canonical = [...m.elements].sort(
        (a, b) => elementOrder.indexOf(a) - elementOrder.indexOf(b),
      );
      expect(m.elements, m.id).toEqual(canonical);
    }
  });

  it('11. belong to at least one island', () => {
    for (const m of monsters) expect(m.islands.length, m.id).toBeGreaterThan(0);
  });

  it('12. link rare/epic variants to an existing common', () => {
    for (const m of monsters) {
      if (m.rarity === 'common') {
        expect(m.variantOf, m.id).toBeUndefined();
      } else {
        expect(m.variantOf, m.id).toBeDefined();
        const base = monsters.find((c) => c.id === m.variantOf);
        expect(base?.rarity, m.id).toBe('common');
      }
    }
  });

  it('only live on islands that have all of their elements', () => {
    for (const m of monsters) {
      for (const islandId of m.islands) {
        const island = islands.find((i) => i.id === islandId);
        expect(island, `${m.id} -> ${islandId}`).toBeDefined();
        for (const element of m.elements) {
          expect(island?.elements, `${m.id} on ${islandId}`).toContain(element);
        }
      }
    }
  });
});

describe('references', () => {
  it('2. every combo references existing monsters', () => {
    for (const c of combos) {
      expect(monsterIds, c.target).toContain(c.target);
      for (const p of c.parents) expect(monsterIds, p).toContain(p);
    }
  });

  it('3. every island id exists', () => {
    for (const m of monsters) for (const i of m.islands) expect(islandIds).toContain(i);
    for (const c of combos) for (const i of c.islands ?? []) expect(islandIds).toContain(i);
  });

  it('4. every element id exists', () => {
    for (const m of monsters) for (const e of m.elements) expect(elementIds).toContain(e);
    for (const i of islands) for (const e of i.elements) expect(elementIds).toContain(e);
  });
});

describe('combos', () => {
  it('6. have alphabetically sorted parents', () => {
    for (const c of combos) {
      expect(c.parents, c.target).toEqual([...c.parents].sort());
    }
  });

  it('7. have no duplicate (target, parents) pairs', () => {
    const seen = new Set<string>();
    for (const c of combos) {
      const key = `${c.target}:${c.parents.join('+')}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
  });

  it('8. satisfy the element union rule unless flagged otherwise', () => {
    for (const c of combos) {
      if (!c.followsElementRule) continue;
      const union = new Set([
        ...(elementsOf.get(c.parents[0]) ?? []),
        ...(elementsOf.get(c.parents[1]) ?? []),
      ]);
      const target = elementsOf.get(c.target) ?? new Set();
      expect([...union].sort(), `${c.parents.join(' + ')} -> ${c.target}`).toEqual(
        [...target].sort(),
      );
    }
  });

  it('9. explain themselves when they break the element rule', () => {
    for (const c of combos) {
      if (c.followsElementRule) continue;
      expect(c.note?.trim(), `${c.parents.join(' + ')} -> ${c.target}`).toBeTruthy();
    }
  });

  it('10. exist for every non-buyable monster', () => {
    const targets = new Set(combos.map((c) => c.target));
    for (const m of monsters) {
      if (m.buyable) continue;
      expect(targets, m.id).toContain(m.id);
    }
  });

  it('15. carry a sane wiki ranking', () => {
    const byTarget = new Map<string, number[]>();
    for (const c of combos) {
      if (c.rank === undefined) {
        // Advice without a rank is a half-entered row.
        expect(c.advice, `${c.parents.join(' + ')} -> ${c.target}`).toBeUndefined();
        continue;
      }
      expect(Number.isInteger(c.rank), c.target).toBe(true);
      expect(c.rank, c.target).toBeGreaterThan(0);
      const ranks = byTarget.get(c.target) ?? [];
      expect(ranks, `duplicate rank ${c.rank} for ${c.target}`).not.toContain(c.rank);
      ranks.push(c.rank);
      byTarget.set(c.target, ranks);
    }
    // A ranking only means something when there's a choice to rank.
    for (const [target, ranks] of byTarget) {
      const total = combos.filter((c) => c.target === target).length;
      expect(total, `${target} is ranked but has one combo`).toBeGreaterThan(1);
      expect(Math.min(...ranks), `${target} has no rank 1`).toBe(1);
    }
  });

  it('13. are island-scoped when the target is an epic', () => {
    const epics = new Set(monsters.filter((m) => m.rarity === 'epic').map((m) => m.id));
    for (const c of combos) {
      if (!epics.has(c.target)) continue;
      expect(c.islands?.length, c.target).toBeGreaterThan(0);
    }
  });
});

/**
 * Monsters with no Rare or Epic on the wiki. Verified page-by-page; anything not in
 * here is assumed to have both, so a forgotten variant extraction fails loudly
 * instead of being noticed by a player.
 */
const NO_VARIANTS = new Set([
  'alcordion', // Werdo
  'bbliszard', // Legendary
  'maggpi', // Werdo
  'parlsona', // Werdo
  'shugabush', // Legendary
  'stoowarb', // Werdo
  't-pirainha', // Werdo
  'tawkerr', // Werdo
]);

describe('variant coverage', () => {
  it('16. every common has a rare and an epic, or is a known exception', () => {
    const ids = new Set(monsters.map((m) => m.id));
    for (const m of monsters) {
      if (m.rarity !== 'common') continue;
      const missing = (['rare', 'epic'] as const).filter((p) => !ids.has(`${p}-${m.id}`));
      if (NO_VARIANTS.has(m.id)) {
        expect(missing, `${m.id} is listed as having no variants`).toHaveLength(2);
      } else {
        expect(missing, `${m.id} is missing variants`).toHaveLength(0);
      }
    }
  });

  it('every variant is reachable on the same island as its common', () => {
    const byId = new Map(monsters.map((m) => [m.id, m]));
    for (const m of monsters) {
      if (m.rarity === 'common' || !m.variantOf) continue;
      const base = byId.get(m.variantOf);
      for (const island of m.islands) {
        expect(base?.islands, `${m.id} on ${island} but ${m.variantOf} isn't`).toContain(
          island,
        );
      }
    }
  });
});

describe('island completeness', () => {
  const NATURAL = new Set(
    elements.filter((e) => e.family === 'natural').map((e) => e.id),
  );

  /**
   * A natural island with N natural elements has exactly one common Natural monster
   * per non-empty subset: 4 elements -> 4 singles + 6 doubles + 4 triples + 1 quad.
   * This is what would have caught Maw and T-Rox being missed on Plant Island, where
   * the guesses named the wrong monster for a valid element pair.
   */
  it('every island has a readable ink colour for its fill', () => {
    for (const i of islands) {
      expect(i.ink, i.name).toMatch(/^#[0-9a-f]{6}$/i);
      expect(i.color, i.name).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('17. every natural element combination on an island has exactly one monster', () => {
    for (const island of islands) {
      const naturals = island.elements.filter((e) => NATURAL.has(e));
      const onIsland = monsters.filter(
        (m) =>
          m.rarity === 'common' &&
          m.islands.includes(island.id) &&
          m.elements.every((e) => NATURAL.has(e)),
      );
      const seen = new Map<string, string[]>();
      for (const m of onIsland) {
        const key = [...m.elements].sort().join('+');
        seen.set(key, [...(seen.get(key) ?? []), m.id]);
      }
      const subsets = 2 ** naturals.length - 1;
      for (let mask = 1; mask <= subsets; mask++) {
        const combo = naturals.filter((_, i) => mask & (1 << i));
        const key = [...combo].sort().join('+');
        expect(seen.get(key), `${island.name} has no monster for ${key}`).toBeDefined();
        expect(seen.get(key), `${island.name} has duplicates for ${key}`).toHaveLength(1);
      }
      expect(onIsland, `${island.name} natural roster`).toHaveLength(subsets);
    }
  });

  /**
   * The app's whole promise is "here's what to breed on this island". A monster that
   * shows up on an island with no attemptable combo and no way to buy it is a dead
   * end — usually a sign its island-specific combos were never extracted.
   */
  it('18. every monster is obtainable on each island it appears on', () => {
    const byId = new Map(monsters.map((m) => [m.id, m]));
    for (const m of monsters) {
      if (m.buyable) continue;
      for (const island of m.islands) {
        const usable = combos.filter(
          (c) =>
            c.target === m.id &&
            (!c.islands || c.islands.includes(island)) &&
            c.parents.every((p) => byId.get(p)?.islands.includes(island)),
        );
        expect(usable.length, `${m.id} has no combo on ${island}`).toBeGreaterThan(0);
      }
    }
  });
});

describe('verification status', () => {
  // Reports, never fails. Seeded data is unverified by design — see docs/DATA-STATUS.md.
  it('reports how much data is still unverified', () => {
    const monstersLeft = monsters.filter((m) => !m.verified).length;
    const combosLeft = combos.filter((c) => !c.verified).length;
    const timesMissing = monsters.filter((m) => !m.breedingTime).length;
    console.info(
      `unverified: ${monstersLeft}/${monsters.length} monsters, ` +
        `${combosLeft}/${combos.length} combos, ${timesMissing} missing breeding times`,
    );
    expect(monstersLeft).toBeGreaterThanOrEqual(0);
  });
});
