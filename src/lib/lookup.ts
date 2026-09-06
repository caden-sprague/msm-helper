import { combosByParent, combosByTarget, monstersById } from './indexes';
import { parseDurationSeconds } from './duration';
import type { Combo, IslandId, Monster } from '../data/types';

export interface ResolvedCombo {
  combo: Combo;
  parents: [Monster, Monster];
  /** Sum of the parents' breeding times in seconds; undefined if either is unknown. */
  cost?: number;
}

export interface ReverseLookupResult {
  /** Combos the user can actually attempt on the active island, cheapest first. */
  attemptable: ResolvedCombo[];
  /** Valid combos that don't work on this island. Never dropped — see docs/PRD.md. */
  elsewhere: ResolvedCombo[];
}

function resolve(combo: Combo): ResolvedCombo | undefined {
  const a = monstersById.get(combo.parents[0]);
  const b = monstersById.get(combo.parents[1]);
  if (!a || !b) return undefined; // invariant 2 makes this unreachable in valid data
  const timeA = parseDurationSeconds(a.breedingTime);
  const timeB = parseDurationSeconds(b.breedingTime);
  const cost = timeA !== undefined && timeB !== undefined ? timeA + timeB : undefined;
  return { combo, parents: [a, b], cost };
}

/**
 * The wiki's explicit ranking wins over anything we compute: it accounts for failure
 * outcomes and retry speed, which breeding times alone don't capture. Unranked combos
 * fall back to cheapest-first, and unknown times sort last rather than pretending to
 * be free.
 */
function byRankThenCost(a: ResolvedCombo, b: ResolvedCombo): number {
  const rankA = a.combo.rank ?? Infinity;
  const rankB = b.combo.rank ?? Infinity;
  if (rankA !== rankB) return rankA - rankB;
  if (a.cost === undefined && b.cost === undefined) return 0;
  if (a.cost === undefined) return 1;
  if (b.cost === undefined) return -1;
  return a.cost - b.cost;
}

export function isAttemptable(resolved: ResolvedCombo, island: IslandId): boolean {
  const { combo, parents } = resolved;
  if (combo.islands && !combo.islands.includes(island)) return false;
  const target = monstersById.get(combo.target);
  if (!target?.islands.includes(island)) return false;
  return parents.every((p) => p.islands.includes(island));
}

/**
 * Every combo that produces `targetId`, split by whether it can be attempted on
 * `island`. Always returns lists: a target typically has several valid combos.
 */
export function reverseLookup(targetId: string, island: IslandId): ReverseLookupResult {
  const all = (combosByTarget.get(targetId) ?? [])
    .map(resolve)
    .filter((r): r is ResolvedCombo => r !== undefined);

  const attemptable: ResolvedCombo[] = [];
  const elsewhere: ResolvedCombo[] = [];
  for (const resolved of all) {
    (isAttemptable(resolved, island) ? attemptable : elsewhere).push(resolved);
  }
  attemptable.sort(byRankThenCost);
  elsewhere.sort(byRankThenCost);
  return { attemptable, elsewhere };
}

/** Everything the given pair can produce. Order of the pair doesn't matter. */
export function forwardLookup(parentA: string, parentB: string): Monster[] {
  const pair = [parentA, parentB].sort();
  const results = (combosByParent.get(parentA) ?? [])
    .filter((c) => c.parents[0] === pair[0] && c.parents[1] === pair[1])
    .map((c) => monstersById.get(c.target))
    .filter((m): m is Monster => m !== undefined);
  return [...new Set(results)];
}
