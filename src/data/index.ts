import elementsJson from './elements.json';
import islandsJson from './islands.json';
import monstersJson from './monsters.json';
import combosJson from './combos.json';
import type { Combo, Element, Island, Monster } from './types';

// JSON imports widen to `string`, so these casts are where the data meets the types.
// The invariant tests in src/lib/data.test.ts are what actually validate the values.
export const elements = elementsJson as Element[];
export const islands = islandsJson as Island[];
export const monsters = monstersJson as Monster[];
export const combos = combosJson as Combo[];
