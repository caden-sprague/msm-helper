import { createContext } from 'react';
import type { PersistedState } from '../lib/storage';
import type { IslandId } from '../data/types';

export interface AppStateValue extends PersistedState {
  setActiveIsland: (island: IslandId) => void;
  /** Pins per island, so switching islands doesn't lose the other island's target. */
  setPinnedTarget: (monsterId: string | null) => void;
  pinnedTarget: string | null;
}

export const AppStateContext = createContext<AppStateValue | null>(null);
