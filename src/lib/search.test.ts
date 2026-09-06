import { describe, expect, it } from 'vitest';
import { searchMonsters } from './search';

describe('rarity filter', () => {
  it('returns only the requested rarity', () => {
    for (const rarity of ['common', 'rare', 'epic'] as const) {
      const results = searchMonsters('', 'plant', rarity);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((m) => m.rarity === rarity)).toBe(true);
    }
  });

  it('defaults to every rarity, commons first', () => {
    const all = searchMonsters('', 'plant');
    expect(all.length).toBe(
      searchMonsters('', 'plant', 'common').length +
        searchMonsters('', 'plant', 'rare').length +
        searchMonsters('', 'plant', 'epic').length,
    );
    expect(all[0].rarity).toBe('common');
    expect(all[all.length - 1].rarity).toBe('epic');
  });

  it('keeps a queried common ahead of its rare and epic namesakes', () => {
    const names = searchMonsters('bowgart', 'plant').map((m) => m.name);
    expect(names[0]).toBe('Bowgart');
    expect(names).toContain('Rare Bowgart');
    expect(names).toContain('Epic Bowgart');
  });
});
