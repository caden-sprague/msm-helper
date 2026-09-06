import { combos, elements, islands, monsters } from '../data';
import type { Combo, Element, ElementId, Island, IslandId, Monster } from '../data/types';

/**
 * Derived lookup tables, built once at module load. The dataset is small enough
 * (low hundreds of rows) that eager construction beats any lazy scheme.
 */

export const monstersById = new Map<string, Monster>(monsters.map((m) => [m.id, m]));
export const islandsById = new Map<IslandId, Island>(islands.map((i) => [i.id, i]));
export const elementsById = new Map<ElementId, Element>(elements.map((e) => [e.id, e]));

export const combosByTarget = new Map<string, Combo[]>();
export const combosByParent = new Map<string, Combo[]>();
export const monstersByIsland = new Map<IslandId, Monster[]>();

for (const combo of combos) {
  const forTarget = combosByTarget.get(combo.target);
  if (forTarget) forTarget.push(combo);
  else combosByTarget.set(combo.target, [combo]);

  for (const parent of combo.parents) {
    const forParent = combosByParent.get(parent);
    if (forParent) forParent.push(combo);
    else combosByParent.set(parent, [combo]);
  }
}

for (const monster of monsters) {
  for (const island of monster.islands) {
    const onIsland = monstersByIsland.get(island);
    if (onIsland) onIsland.push(monster);
    else monstersByIsland.set(island, [monster]);
  }
}

export const sortedIslands = [...islands].sort((a, b) => a.order - b.order);

/** Canonical element order, taken from elements.json rather than hardcoded. */
export const elementOrder = elements.map((e) => e.id);
