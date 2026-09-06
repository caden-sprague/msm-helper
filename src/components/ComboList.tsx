import { formatDuration } from '../lib/duration';
import type { ResolvedCombo } from '../lib/lookup';
import { ElementPips } from './ElementPips';

function ComboRow({ resolved }: { resolved: ResolvedCombo }) {
  const [a, b] = resolved.parents;
  return (
    <li className="combo">
      <div className="combo-parent">
        <span className="combo-name">{a.name}</span>
        <ElementPips elements={a.elements} />
      </div>
      <span className="combo-plus">+</span>
      <div className="combo-parent">
        <span className="combo-name">{b.name}</span>
        <ElementPips elements={b.elements} />
      </div>
      <span className="combo-cost">
        {resolved.cost === undefined
          ? ''
          : formatDuration(`PT${Math.round(resolved.cost / 60)}M`)}
      </span>
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
  if (combos.length === 0) return <p className="muted">{emptyMessage}</p>;
  return (
    <ul className="combo-list" aria-label={label}>
      {combos.map((resolved) => (
        <ComboRow key={resolved.combo.parents.join('+')} resolved={resolved} />
      ))}
    </ul>
  );
}
