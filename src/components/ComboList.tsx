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

const BADGES: Record<number, string> = { 1: 'Best', 2: 'Runner-up' };

function ComboRow({ resolved }: { resolved: ResolvedCombo }) {
  const [a, b] = resolved.parents;
  const { rank, advice } = resolved.combo;
  const badge = rank ? BADGES[rank] : undefined;
  return (
    <li className={rank === 1 ? 'combo is-best' : 'combo'}>
      {badge && <span className={`combo-badge rank-${rank}`}>{badge}</span>}
      <div className="combo-pair">
        <Parent name={a.name} elements={a.elements} time={a.breedingTime} />
        <span className="combo-plus" aria-hidden="true">
          +
        </span>
        <Parent name={b.name} elements={b.elements} time={b.breedingTime} mirrored />
      </div>
      {advice && <p className="combo-advice">{advice}</p>}
    </li>
  );
}

export function ComboList({
  combos,
  emptyMessage,
  label,
}: {
  combos: ResolvedCombo[];
  emptyMessage: string;
  label: string;
}) {
  if (combos.length === 0) return <p className="empty">{emptyMessage}</p>;
  return (
    <ul className="combo-list" aria-label={label}>
      {combos.map((resolved) => (
        <ComboRow key={resolved.combo.parents.join('+')} resolved={resolved} />
      ))}
    </ul>
  );
}
