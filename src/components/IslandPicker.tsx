import { sortedIslands } from '../lib/indexes';
import type { IslandId } from '../data/types';

/** A row of pills rather than a native select: one tap instead of two. */
export function IslandPicker({
  active,
  onChange,
}: {
  active: IslandId;
  onChange: (island: IslandId) => void;
}) {
  return (
    <div className="islands" role="group" aria-label="Island">
      {sortedIslands.map((island) => (
        <button
          key={island.id}
          className="island-pill"
          aria-pressed={island.id === active}
          style={{ '--pill': island.color } as React.CSSProperties}
          onClick={() => onChange(island.id)}
        >
          {island.name.replace(' Island', '')}
        </button>
      ))}
    </div>
  );
}
