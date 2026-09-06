import { useMemo, useState } from 'react';
import { ComboList } from './components/ComboList';
import { ElementPips } from './components/ElementPips';
import { IslandPicker } from './components/IslandPicker';
import { MonsterAvatar } from './components/MonsterAvatar';
import { formatDuration } from './lib/duration';
import { islandsById, monstersById } from './lib/indexes';
import { reverseLookup } from './lib/lookup';
import { searchMonsters } from './lib/search';
import { useAppState } from './state/useAppState';

export default function App() {
  const { activeIsland, setActiveIsland, pinnedTarget, setPinnedTarget } = useAppState();
  const [query, setQuery] = useState('');
  const [showAllIslands, setShowAllIslands] = useState(false);

  const island = islandsById.get(activeIsland);
  const target = pinnedTarget ? monstersById.get(pinnedTarget) : undefined;

  const results = useMemo(
    () => searchMonsters(query, activeIsland).slice(0, 24),
    [query, activeIsland],
  );
  const lookup = useMemo(
    () => (target ? reverseLookup(target.id, activeIsland) : undefined),
    [target, activeIsland],
  );
  const elsewhere = lookup?.elsewhere ?? [];

  return (
    <div className="app" style={{ '--island': island?.color } as React.CSSProperties}>
      <div className="glow" aria-hidden="true" />

      <header className="topbar">
        <h1>
          MSM <span>Helper</span>
        </h1>
        <IslandPicker active={activeIsland} onChange={setActiveIsland} />
      </header>

      <main>
        {target ? (
          <section className="target" aria-label="Currently breeding">
            <div className="target-card">
              <MonsterAvatar name={target.name} elements={target.elements} size="lg" />
              <div className="target-info">
                <p className="eyebrow">Breeding for</p>
                <h2>{target.name}</h2>
                <ElementPips elements={target.elements} />
              </div>
              <button className="icon-button" onClick={() => setPinnedTarget(null)} title="Clear">
                <span aria-hidden="true">✕</span>
                <span className="sr-only">Clear target</span>
              </button>
            </div>

            <dl className="facts">
              <div>
                <dt>Time</dt>
                <dd>{formatDuration(target.breedingTime)}</dd>
              </div>
              <div>
                <dt>Combos</dt>
                <dd>{lookup?.attemptable.length ?? 0}</dd>
              </div>
              <div>
                <dt>Island</dt>
                <dd>{island?.name.replace(' Island', '')}</dd>
              </div>
            </dl>

            <h3>Breed with</h3>
            <ComboList
              label="Breeding combos"
              combos={lookup?.attemptable ?? []}
              emptyMessage={
                target.buyable
                  ? `Bought from the market — no breeding needed.`
                  : `No combos available on ${island?.name}.`
              }
            />

            {elsewhere.length > 0 && (
              <div className="elsewhere">
                <button className="link" onClick={() => setShowAllIslands((v) => !v)}>
                  {showAllIslands ? 'Hide' : 'Show'} {elsewhere.length} combo
                  {elsewhere.length === 1 ? '' : 's'} from other islands
                </button>
                {showAllIslands && (
                  <ComboList
                    label="Combos from other islands"
                    combos={elsewhere}
                    emptyMessage=""
                  />
                )}
              </div>
            )}
          </section>
        ) : (
          <section className="hero">
            <h2>What are you breeding?</h2>
            <p>
              Pick a monster and it stays pinned — per island — until you clear it. No more
              writing it down.
            </p>
          </section>
        )}

        <section className="search" aria-label="Find a monster">
          <div className="search-field">
            <span className="search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              type="search"
              placeholder="Search monsters…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          <ul className="results" aria-label="Search results">
            {results.map((monster) => (
              <li key={monster.id}>
                <button
                  className={monster.id === target?.id ? 'result is-active' : 'result'}
                  onClick={() => {
                    setPinnedTarget(monster.id);
                    setQuery('');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <MonsterAvatar name={monster.name} elements={monster.elements} size="sm" />
                  <span className="result-name">{monster.name}</span>
                  <span className="result-time">{formatDuration(monster.breedingTime)}</span>
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="empty">No monsters match “{query}”.</li>}
          </ul>
        </section>
      </main>
    </div>
  );
}
