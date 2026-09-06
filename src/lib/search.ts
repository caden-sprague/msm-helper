import { monsters } from '../data';
import { monstersByIsland } from './indexes';
import type { IslandId, Monster, Rarity } from '../data/types';

export type RarityFilter = Rarity | 'all';

/**
 * Commons first. Alphabetical order alone buries them: "Epic Bowgart" sorts between
 * "Entbrat" and "Furcorn", and with 19 epics the commons fall off the end of the list.
 */
const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic'];
const byRarityThenName = (a: Monster, b: Monster): number =>
  RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) ||
  a.name.localeCompare(b.name);

/**
 * Subsequence match: "bwgrt" finds "Bowgart". Enough fuzziness to survive thumb
 * typos without pulling in a fuzzy-search dependency.
 */
function score(name: string, query: string): number | undefined {
  const haystack = name.toLowerCase();
  const needle = query.toLowerCase();
  if (!needle) return 0;
  if (haystack.startsWith(needle)) return 0;
  const wordStart = haystack.indexOf(needle);
  if (wordStart > 0) return 1;

  let index = 0;
  let gaps = 0;
  for (const char of needle) {
    const found = haystack.indexOf(char, index);
    if (found === -1) return undefined;
    gaps += found - index;
    index = found + 1;
  }
  return 2 + gaps;
}

export function searchMonsters(
  query: string,
  island: IslandId | 'all',
  rarity: RarityFilter = 'all',
): Monster[] {
  const onIsland = island === 'all' ? monsters : (monstersByIsland.get(island) ?? []);
  const pool = rarity === 'all' ? onIsland : onIsland.filter((m) => m.rarity === rarity);
  const trimmed = query.trim();
  if (!trimmed) return [...pool].sort(byRarityThenName);

  return pool
    .map((monster) => ({ monster, rank: score(monster.name, trimmed) }))
    .filter((r): r is { monster: Monster; rank: number } => r.rank !== undefined)
    .sort((a, b) => a.rank - b.rank || byRarityThenName(a.monster, b.monster))
    .map((r) => r.monster);
}
