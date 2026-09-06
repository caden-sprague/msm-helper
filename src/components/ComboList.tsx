import { formatDuration } from '../lib/duration';
import type { ResolvedCombo } from '../lib/lookup';
import { MonsterAvatar } from './MonsterAvatar';

function Parent({
  name,
  elements,
  time,
  mirrored = false,
}: {
  name: string;
  elements: string[];
  time?: string;
  /** The right-hand parent reads inward, so the pair balances around the "+". */
  mirrored?: boolean;
}) {
  return (
    <div className={mirrored ? 'parent is-mirrored' : 'parent'}>
      <MonsterAvatar name={name} elements={elements as never} size="sm" />
      <span className="parent-text">
        <span className="parent-name">{name}</span>
        {time && <span className="parent-time">{formatDuration(time)}</span>}
      </span>
    </div>
  );
}

function ComboRow({ resolved, rank }: { resolved: ResolvedCombo; rank: number }) {
  const [a, b] = resolved.parents;
  return (
    <li className="combo">
      {rank === 0 && <span className="combo-badge">Fastest</span>}
      <Parent name={a.name} elements={a.elements} time={a.breedingTime} />
      <span className="combo-plus" aria-hidden="true">
        +
      </span>
      <Parent name={b.name} elements={b.elements} time={b.breedingTime} mirrored />
    </li>
  );
}

export function ComboList({
  combos,
  emptyMessage,
  label,
  ranked = false,
}: {
  combos: ResolvedCombo[];
  emptyMessage: string;
  label: string;
  /** Only the attemptable list earns a "Fastest" badge, and only if times are known. */
  ranked?: boolean;
}) {
  if (combos.length === 0) return <p className="empty">{emptyMessage}</p>;
  const showBadge = ranked && combos.length > 1 && combos[0].cost !== undefined;
  return (
    <ul className="combo-list" aria-label={label}>
      {combos.map((resolved, i) => (
        <ComboRow
          key={resolved.combo.parents.join('+')}
          resolved={resolved}
          rank={showBadge ? i : -1}
        />
      ))}
    </ul>
  );
}
