import { loadBadges, resetBadges } from '../badges.js';

function createLocalStorageMock() {
  const store = new Map();
  return {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
  };
}

describe('badges.loadBadges', () => {
  beforeEach(() => {
    global.localStorage = createLocalStorageMock();
    resetBadges();
  });

  test('loads valid badge arrays', () => {
    localStorage.setItem('glm-badges', JSON.stringify(['Seedling', 'Champion']));
    expect(loadBadges()).toEqual(['Seedling', 'Champion']);
  });

  test('returns [] for non-array parsed values', () => {
    localStorage.setItem('glm-badges', JSON.stringify({ badge: 'Seedling' }));
    expect(loadBadges()).toEqual([]);
  });

  test('returns [] when parsed array contains non-strings', () => {
    localStorage.setItem('glm-badges', JSON.stringify(['Seedling', 3]));
    expect(loadBadges()).toEqual([]);
  });

  test('returns [] when JSON is malformed', () => {
    localStorage.setItem('glm-badges', '{"broken":');
    expect(loadBadges()).toEqual([]);
  });
});
