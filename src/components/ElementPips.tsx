import { elementsById } from '../lib/indexes';
import type { ElementId } from '../data/types';

/**
 * Colour is never the only signal — several MSM element colours sit close together,
 * so each pip is labelled. See docs/ARCHITECTURE.md.
 */
export function ElementPips({ elements }: { elements: ElementId[] }) {
  return (
    <span className="pips">
      {elements.map((id) => {
        const element = elementsById.get(id);
        return (
          <span key={id} className="pip" style={{ '--pip': element?.color } as React.CSSProperties}>
            <span className="pip-dot" aria-hidden="true" />
            {element?.name}
          </span>
        );
      })}
    </span>
  );
}
