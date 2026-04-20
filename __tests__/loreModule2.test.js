import {
  LORE_FRAGMENTS,
  getFragmentById,
  getFragmentsByElement,
  getFragmentsByStat,
} from '../loreModule2.js';

describe('loreModule2 — LORE_FRAGMENTS', () => {
  test('contains exactly 21 fragments', () => {
    expect(LORE_FRAGMENTS).toHaveLength(21);
  });

  test('every fragment has required fields: id, title, text', () => {
    LORE_FRAGMENTS.forEach(f => {
      expect(typeof f.id).toBe('string');
      expect(f.id.length).toBeGreaterThan(0);
      expect(typeof f.title).toBe('string');
      expect(f.title.length).toBeGreaterThan(0);
      expect(typeof f.text).toBe('string');
      expect(f.text.length).toBeGreaterThan(0);
    });
  });

  test('all fragment ids are unique', () => {
    const ids = LORE_FRAGMENTS.map(f => f.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  test('there are exactly 6 element-based fragments', () => {
    const elementFragments = LORE_FRAGMENTS.filter(f => f.element);
    expect(elementFragments).toHaveLength(6);
  });

  test('there are exactly 7 star/constellation fragments', () => {
    const starFragments = LORE_FRAGMENTS.filter(f => f.constellation);
    expect(starFragments).toHaveLength(7);
  });

  test('there are exactly 8 conscience/stat fragments (2 per stat)', () => {
    const statFragments = LORE_FRAGMENTS.filter(f => f.stat);
    expect(statFragments).toHaveLength(8);
    const stats = ['karma', 'wisdom', 'integrity', 'community'];
    stats.forEach(stat => {
      const count = statFragments.filter(f => f.stat === stat).length;
      expect(count).toBe(2);
    });
  });
});

describe('loreModule2 — getFragmentById', () => {
  test('returns the correct fragment for a known id', () => {
    const frag = getFragmentById('lore-radiant-1');
    expect(frag).not.toBeNull();
    expect(frag.element).toBe('radiant');
  });

  test('returns null for an unknown id', () => {
    expect(getFragmentById('does-not-exist')).toBeNull();
  });
});

describe('loreModule2 — getFragmentsByElement', () => {
  test('returns fragments for a valid element', () => {
    const frags = getFragmentsByElement('forge');
    expect(frags.length).toBeGreaterThan(0);
    frags.forEach(f => expect(f.element).toBe('forge'));
  });

  test('returns empty array for an unknown element', () => {
    expect(getFragmentsByElement('nonexistent')).toEqual([]);
  });
});

describe('loreModule2 — getFragmentsByStat', () => {
  test('returns fragments for the karma stat', () => {
    const frags = getFragmentsByStat('karma');
    expect(frags).toHaveLength(2);
    frags.forEach(f => expect(f.stat).toBe('karma'));
  });

  test('returns empty array for an unknown stat', () => {
    expect(getFragmentsByStat('strength')).toEqual([]);
  });
});
