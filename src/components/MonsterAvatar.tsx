import { useState } from 'react';
import { elementsById } from '../lib/indexes';
import type { ElementId } from '../data/types';

/**
 * Monster art when we have it, an element-sliced disc when we don't. The fallback
 * still carries information — a Bowgart reads plant/cold/water at a glance — so a
 * missing icon degrades rather than breaking.
 */
export function MonsterAvatar({
  name,
  elements,
  icon,
  size = 'md',
}: {
  name: string;
  elements: ElementId[];
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [failed, setFailed] = useState(false);

  const slice = 360 / elements.length;
  const stops = elements
    .map((id, i) => {
      const color = elementsById.get(id)?.color ?? '#888';
      return `${color} ${i * slice}deg ${(i + 1) * slice}deg`;
    })
    .join(', ');

  // The element wash sits behind the art too: it fills the sprite's transparent
  // corners and keeps every avatar the same visual weight.
  return (
    <span
      className={`avatar avatar-${size}${icon && !failed ? ' has-art' : ''}`}
      style={{ background: `conic-gradient(from 210deg, ${stops})` }}
      aria-hidden="true"
    >
      {icon && !failed ? (
        <img
          className="avatar-art"
          src={`${import.meta.env.BASE_URL}icons/${icon}`}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="avatar-initials">
          {name
            .split(/[\s-]/)
            .slice(0, 2)
            .map((word) => word.charAt(0))
            .join('')}
        </span>
      )}
    </span>
  );
}
