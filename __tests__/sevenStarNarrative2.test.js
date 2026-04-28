import { SevenStarNarrative2 } from '../sevenStarNarrative2.js';
import { NarrativeBridge2, BEAT_TYPE } from '../narrativeBridge2.js';
import { LORE_FRAGMENTS } from '../loreModule2.js';

function makeBridgeAndStar() {
  const onBeat = jest.fn();
  const bridge = new NarrativeBridge2(onBeat);
  const star   = new SevenStarNarrative2(bridge);
  return { bridge, star, onBeat };
}

describe('SevenStarNarrative2 — initial state', () => {
  test('getUnlockedCount starts at 0', () => {
    const { star } = makeBridgeAndStar();
    expect(star.getUnlockedCount()).toBe(0);
  });

  test('getUnlocked starts as an empty array', () => {
    const { star } = makeBridgeAndStar();
    expect(star.getUnlocked()).toHaveLength(0);
  });
});

describe('SevenStarNarrative2 — checkThresholds', () => {
  test('unlocks the karma omen when karma reaches threshold 25', () => {
    const { star } = makeBridgeAndStar();
    const newOmens = star.checkThresholds({ karma: 25, wisdom: 0, integrity: 0, community: 0 });
    const karmaFrag = newOmens.find(f => f.stat === 'karma' && f.threshold === 25);
    expect(karmaFrag).toBeDefined();
  });

  test('does not unlock the same omen twice', () => {
    const { star } = makeBridgeAndStar();
    const conscience = { karma: 25, wisdom: 0, integrity: 0, community: 0 };
    star.checkThresholds(conscience);
    const second = star.checkThresholds(conscience);
    expect(second.find(f => f.stat === 'karma' && f.threshold === 25)).toBeUndefined();
  });

  test('unlocks the wisdom omen at threshold 25', () => {
    const { star } = makeBridgeAndStar();
    const newOmens = star.checkThresholds({ karma: 0, wisdom: 30, integrity: 0, community: 0 });
    expect(newOmens.find(f => f.stat === 'wisdom' && f.threshold === 25)).toBeDefined();
  });

  test('unlocks the integrity omen at threshold 25', () => {
    const { star } = makeBridgeAndStar();
    const newOmens = star.checkThresholds({ karma: 0, wisdom: 0, integrity: 25, community: 0 });
    expect(newOmens.find(f => f.stat === 'integrity' && f.threshold === 25)).toBeDefined();
  });

  test('unlocks the community omen at threshold 25', () => {
    const { star } = makeBridgeAndStar();
    const newOmens = star.checkThresholds({ karma: 0, wisdom: 0, integrity: 0, community: 25 });
    expect(newOmens.find(f => f.stat === 'community' && f.threshold === 25)).toBeDefined();
  });

  test('emits an OMEN beat via the bridge when an omen unlocks', () => {
    const { star, onBeat } = makeBridgeAndStar();
    star.checkThresholds({ karma: 25, wisdom: 0, integrity: 0, community: 0 });
    const omenBeats = onBeat.mock.calls.filter(([beat]) => beat.type === BEAT_TYPE.OMEN);
    expect(omenBeats.length).toBeGreaterThan(0);
  });

  test('emits a FORGE_MOMENT beat when an integrity omen unlocks', () => {
    const { star, onBeat } = makeBridgeAndStar();
    star.checkThresholds({ karma: 0, wisdom: 0, integrity: 25, community: 0 });
    const forgeBeats = onBeat.mock.calls.filter(([beat]) => beat.type === BEAT_TYPE.FORGE_MOMENT);
    expect(forgeBeats.length).toBeGreaterThan(0);
  });
});

describe('SevenStarNarrative2 — getUnlocked / reset', () => {
  test('getUnlocked returns the unlocked fragment objects', () => {
    const { star } = makeBridgeAndStar();
    star.checkThresholds({ karma: 25, wisdom: 0, integrity: 0, community: 0 });
    const unlocked = star.getUnlocked();
    expect(unlocked.length).toBeGreaterThan(0);
    unlocked.forEach(f => expect(LORE_FRAGMENTS).toContain(f));
  });

  test('reset clears all unlocked fragments', () => {
    const { star } = makeBridgeAndStar();
    star.checkThresholds({ karma: 100, wisdom: 100, integrity: 100, community: 100 });
    expect(star.getUnlockedCount()).toBeGreaterThan(0);
    star.reset();
    expect(star.getUnlockedCount()).toBe(0);
  });
});
