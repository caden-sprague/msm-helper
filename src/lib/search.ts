import { monsters } from '../data';
import { monstersByIsland } from './indexes';
import type { IslandId, Monster } from '../data/types';

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

export function searchMonsters(query: string, island: IslandId | 'all'): Monster[] {
  const pool = island === 'all' ? monsters : (monstersByIsland.get(island) ?? []);
  const trimmed = query.trim();
  if (!trimmed) return [...pool].sort((a, b) => a.name.localeCompare(b.name));

  return pool
    .map((monster) => ({ monster, rank: score(monster.name, trimmed) }))
    .filter((r): r is { monster: Monster; rank: number } => r.rank !== undefined)
    .sort((a, b) => a.rank - b.rank || a.monster.name.localeCompare(b.monster.name))
    .map((r) => r.monster);
}
