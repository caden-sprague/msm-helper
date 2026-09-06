import { describe, expect, it } from 'vitest';
import { forwardLookup, reverseLookup } from './lookup';

describe('reverseLookup', () => {
  it('returns every combo for a target, not just one', () => {
    const { attemptable } = reverseLookup('bowgart', 'plant');
    expect(attemptable.length).toBeGreaterThan(1);
    for (const r of attemptable) expect(r.combo.target).toBe('bowgart');
  });

  it('resolves parent ids to full monsters', () => {
    const { attemptable } = reverseLookup('furcorn', 'plant');
    const names = attemptable[0].parents.map((p) => p.name).sort();
    expect(names).toEqual(['Mammott', 'Potbelly']);
  });

  it('returns empty lists for a buyable monster with no combos', () => {
    const { attemptable, elsewhere } = reverseLookup('potbelly', 'plant');
    expect(attemptable).toEqual([]);
    expect(elsewhere).toEqual([]);
  });
});

describe('forwardLookup', () => {
  it('is order independent', () => {
    expect(forwardLookup('mammott', 'potbelly')).toEqual(
      forwardLookup('potbelly', 'mammott'),
    );
  });

  it('finds the double produced by two singles', () => {
    expect(forwardLookup('mammott', 'potbelly').map((m) => m.id)).toContain('furcorn');
  });
});
