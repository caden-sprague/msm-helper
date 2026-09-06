import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppStateContext, type AppStateValue } from './context';
import { defaultState, loadState, saveState, type PersistedState } from '../lib/storage';
import type { IslandId } from '../data/types';

const SAVE_DEBOUNCE_MS = 300;

export function AppStateProvider({ children }: { children: ReactNode }) {
  // Lazy init: read storage once, before first paint, so there's no flash of defaults.
  const [state, setState] = useState<PersistedState>(() => {
    try {
      return loadState();
    } catch {
      return defaultState();
    }
  });

  // Mobile has no reliable unload event, so persist continuously rather than on exit.
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => saveState(state), SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer.current);
  }, [state]);

  const setActiveIsland = useCallback((island: IslandId) => {
    setState((prev) => ({ ...prev, activeIsland: island }));
  }, []);

  const setPinnedTarget = useCallback((monsterId: string | null) => {
    setState((prev) => ({
      ...prev,
      pinnedTargets: { ...prev.pinnedTargets, [prev.activeIsland]: monsterId },
    }));
  }, []);

  const value = useMemo<AppStateValue>(
    () => ({
      ...state,
      pinnedTarget: state.pinnedTargets[state.activeIsland] ?? null,
      setActiveIsland,
      setPinnedTarget,
    }),
    [state, setActiveIsland, setPinnedTarget],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
