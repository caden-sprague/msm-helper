import { beforeEach, describe, expect, it } from 'vitest';
import { defaultState, loadState, saveState } from './storage';

const KEY = 'msmhelper.state.v1';

describe('loadState', () => {
  beforeEach(() => localStorage.clear());

  it('falls back to defaults when nothing is stored', () => {
    expect(loadState()).toEqual(defaultState());
  });

  it('falls back on malformed JSON', () => {
    localStorage.setItem(KEY, '{not json');
    expect(loadState()).toEqual(defaultState());
  });

  it('falls back on a version mismatch', () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 99, activeIsland: 'plant' }));
    expect(loadState()).toEqual(defaultState());
  });

  it('drops pins for monsters that no longer exist', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        version: 1,
        activeIsland: 'plant',
        pinnedTargets: { plant: 'deleted-monster', nowhere: 'bowgart' },
      }),
    );
    expect(loadState().pinnedTargets).toEqual({});
  });

  it('round-trips a valid pin', () => {
    saveState({ activeIsland: 'plant', pinnedTargets: { plant: 'entbrat' } });
    expect(loadState()).toEqual({
      activeIsland: 'plant',
      pinnedTargets: { plant: 'entbrat' },
    });
  });
});
