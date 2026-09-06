import { elementsById } from '../lib/indexes';
import type { ElementId } from '../data/types';

/**
 * Colour is never the only signal — several MSM element colours are close together,
 * so each pip carries its initial and a title. See docs/ARCHITECTURE.md.
 */
export function ElementPips({ elements }: { elements: ElementId[] }) {
  return (
    <span className="pips">
      {elements.map((id) => {
        const element = elementsById.get(id);
        return (
          <span
            key={id}
            className="pip"
            style={{ background: element?.color }}
            title={element?.name}
          >
            {element?.name.charAt(0)}
          </span>
        );
      })}
    </span>
  );
}
