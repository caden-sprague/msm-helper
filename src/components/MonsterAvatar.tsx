import { elementsById } from '../lib/indexes';
import type { ElementId } from '../data/types';

/**
 * Stands in for monster art, which we don't have. A conic slice per element means the
 * avatar carries real information rather than being decoration: a Bowgart reads as
 * plant/cold/water at a glance.
 */
export function MonsterAvatar({
  name,
  elements,
  size = 'md',
}: {
  name: string;
  elements: ElementId[];
  size?: 'sm' | 'md' | 'lg';
}) {
  const slice = 360 / elements.length;
  const stops = elements
    .map((id, i) => {
      const color = elementsById.get(id)?.color ?? '#888';
      return `${color} ${i * slice}deg ${(i + 1) * slice}deg`;
    })
    .join(', ');

  // Two letters reads better than one for "Toe Jammer" vs "T-Rox".
  const initials = name
    .split(/[\s-]/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('');

  return (
    <span
      className={`avatar avatar-${size}`}
      style={{ background: `conic-gradient(from 210deg, ${stops})` }}
      aria-hidden="true"
    >
      <span className="avatar-initials">{initials}</span>
    </span>
  );
}
