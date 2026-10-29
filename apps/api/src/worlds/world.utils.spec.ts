import {
  normalizeFeedKind,
  normalizeRelationshipStatus,
  normalizeStats,
  statusForLevel,
  uniqueHandle,
} from './world.utils.js';

describe('world utils', () => {
  it('deduplicates and normalizes handles', () => {
    const used = new Set<string>();

    expect(uniqueHandle('@Mina Park', 'Mina Park', used)).toBe('@minapark');
    expect(uniqueHandle('@minapark', 'Mina Park', used)).toBe('@minapark2');
    expect(used.has('@minapark')).toBe(true);
    expect(used.has('@minapark2')).toBe(true);
  });

  it('normalizes stats with clamping and defaults', () => {
    expect(
      normalizeStats({ Fame: 120, Talent: -5, Reputation: 42.6 }, [
        'Fame',
        'Talent',
        'Reputation',
        'Money',
      ]),
    ).toEqual({
      Fame: 100,
      Talent: 0,
      Reputation: 43,
      Money: 50,
    });
  });

  it('maps relationship levels to statuses', () => {
    expect(statusForLevel(-70)).toBe('enemy');
    expect(statusForLevel(-30)).toBe('rival');
    expect(statusForLevel(0)).toBe('neutral');
    expect(statusForLevel(40)).toBe('friendly');
    expect(statusForLevel(80)).toBe('close');
  });

  it('keeps DMs out of the public feed kinds', () => {
    expect(normalizeFeedKind('dm')).toBe('reply');
    expect(normalizeFeedKind('headline')).toBe('headline');
    expect(normalizeFeedKind('nonsense')).toBe('post');
  });

  it('falls back for invalid relationship statuses', () => {
    expect(normalizeRelationshipStatus('enemy')).toBe('enemy');
    expect(normalizeRelationshipStatus('situationship', 'friendly')).toBe(
      'friendly',
    );
  });
});
