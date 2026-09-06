import { useMemo, useState } from 'react';
import { ComboList } from './components/ComboList';
import { ElementPips } from './components/ElementPips';
import { islandsById, monstersById, sortedIslands } from './lib/indexes';
import { reverseLookup } from './lib/lookup';
import { searchMonsters } from './lib/search';
import { useAppState } from './state/useAppState';
import type { IslandId } from './data/types';

export default function App() {
  const { activeIsland, setActiveIsland, pinnedTarget, setPinnedTarget } = useAppState();
  const [query, setQuery] = useState('');
  const [showAllIslands, setShowAllIslands] = useState(false);

  const island = islandsById.get(activeIsland);
  const target = pinnedTarget ? monstersById.get(pinnedTarget) : undefined;

  const results = useMemo(
    () => searchMonsters(query, activeIsland).slice(0, 20),
    [query, activeIsland],
  );
  const lookup = useMemo(
    () => (target ? reverseLookup(target.id, activeIsland) : undefined),
    [target, activeIsland],
  );

  return (
    <div className="app" style={{ '--island': island?.color } as React.CSSProperties}>
      <header>
        <h1>MSM Helper</h1>
        <select
          aria-label="Island"
          value={activeIsland}
          onChange={(e) => setActiveIsland(e.target.value as IslandId)}
        >
          {sortedIslands.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </header>

      {target ? (
        <section className="target">
          <div className="target-head">
            <div>
              <h2>{target.name}</h2>
              <ElementPips elements={target.elements} />
            </div>
            <button onClick={() => setPinnedTarget(null)}>Clear</button>
          </div>

          <h3>Breed with</h3>
          <ComboList
            label="Breeding combos"
            combos={lookup?.attemptable ?? []}
            emptyMessage={
              target.buyable
                ? 'Bought from the market — no breeding needed.'
                : `No combos available on ${island?.name}.`
            }
          />

          {(lookup?.elsewhere.length ?? 0) > 0 && (
            <>
              <button className="link" onClick={() => setShowAllIslands((v) => !v)}>
                {showAllIslands ? 'Hide' : 'Show'} {lookup?.elsewhere.length} combo(s) from
                other islands
              </button>
              {showAllIslands && (
                <ComboList
                  label="Combos from other islands"
                  combos={lookup?.elsewhere ?? []}
                  emptyMessage=""
                />
              )}
            </>
          )}
        </section>
      ) : (
        <p className="muted">Pick a monster to start tracking what you're breeding.</p>
      )}

      <section className="search">
        <input
          type="search"
          placeholder="Search monsters…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        <ul className="results" aria-label="Search results">
          {results.map((monster) => (
            <li key={monster.id}>
              <button
                onClick={() => {
                  setPinnedTarget(monster.id);
                  setQuery('');
                }}
              >
                <span>{monster.name}</span>
                <ElementPips elements={monster.elements} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
