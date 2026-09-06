import { islandsById, monstersById, sortedIslands } from './indexes';
import type { IslandId } from '../data/types';

/** The only module in the app that touches localStorage. See docs/ARCHITECTURE.md. */

const KEY = 'msmhelper.state.v1';
const VERSION = 1;

export interface PersistedState {
  activeIsland: IslandId;
  pinnedTargets: Partial<Record<IslandId, string | null>>;
}

export const defaultState = (): PersistedState => ({
  activeIsland: sortedIslands[0]?.id ?? 'plant',
  pinnedTargets: {},
});

/**
 * Defensive by design: a missing key, malformed JSON, a version bump, or an id that
 * no longer exists in the dataset all fall back to defaults instead of throwing.
 * Stale ids are dropped silently — the user re-picks in two taps.
 */
export function loadState(): PersistedState {
  const fallback = defaultState();
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return fallback; // private mode / storage disabled
  }
  if (!raw) return fallback;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fallback;
  }
  if (typeof parsed !== 'object' || parsed === null) return fallback;

  const blob = parsed as Record<string, unknown>;
  if (blob.version !== VERSION) return fallback;

  const activeIsland =
    typeof blob.activeIsland === 'string' && islandsById.has(blob.activeIsland as IslandId)
      ? (blob.activeIsland as IslandId)
      : fallback.activeIsland;

  const pinnedTargets: PersistedState['pinnedTargets'] = {};
  const stored = blob.pinnedTargets;
  if (typeof stored === 'object' && stored !== null) {
    for (const [island, monster] of Object.entries(stored)) {
      if (!islandsById.has(island as IslandId)) continue;
      if (typeof monster !== 'string' || !monstersById.has(monster)) continue;
      pinnedTargets[island as IslandId] = monster;
    }
  }

  return { activeIsland, pinnedTargets };
}

export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ version: VERSION, ...state, updatedAt: new Date().toISOString() }),
    );
  } catch {
    // Quota or private mode. Losing the pin is survivable; crashing isn't.
  }
}
