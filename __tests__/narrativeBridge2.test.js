import { createBeat, BEAT_TYPE, NarrativeBridge2 } from '../narrativeBridge2.js';

describe('narrativeBridge2 — createBeat', () => {
  test('creates a beat with the specified type', () => {
    const beat = createBeat(BEAT_TYPE.MATCH, { element: 'radiant', score: 100 });
    expect(beat.type).toBe(BEAT_TYPE.MATCH);
  });

  test('beat includes a non-empty message string', () => {
    const beat = createBeat(BEAT_TYPE.MATCH, { element: 'forge', score: 50 });
    expect(typeof beat.message).toBe('string');
    expect(beat.message.length).toBeGreaterThan(0);
  });

  test('beat includes the context object', () => {
    const ctx  = { element: 'tide', score: 200 };
    const beat = createBeat(BEAT_TYPE.MATCH, ctx);
    expect(beat.ctx).toEqual(ctx);
  });

  test('beat includes a numeric timestamp', () => {
    const beat = createBeat(BEAT_TYPE.LEVEL_UP, { level: 2 });
    expect(typeof beat.timestamp).toBe('number');
  });

  test('throws for an unknown beat type', () => {
    expect(() => createBeat('not_a_real_type')).toThrow();
  });

  test('MATCH beat message includes element and score', () => {
    const beat = createBeat(BEAT_TYPE.MATCH, { element: 'verdant', score: 150 });
    expect(beat.message).toMatch(/Verdant/i);
    expect(beat.message).toMatch(/150/);
  });

  test('CASCADE beat message includes chain number', () => {
    const beat = createBeat(BEAT_TYPE.CASCADE, { chain: 3, score: 300 });
    expect(beat.message).toMatch(/3/);
  });

  test('BOARD_CLEAR beat message mentions conscience stats', () => {
    const beat = createBeat(BEAT_TYPE.BOARD_CLEAR);
    expect(beat.message).toMatch(/board clear/i);
  });

  test('OMEN beat message includes the omen title', () => {
    const beat = createBeat(BEAT_TYPE.OMEN, { title: 'The Forge Kindles' });
    expect(beat.message).toMatch(/The Forge Kindles/);
  });

  test('SPECIAL_SPAWN beat message includes the special type', () => {
    const beat = createBeat(BEAT_TYPE.SPECIAL_SPAWN, { special: 'nova' });
    expect(beat.message).toMatch(/Nova/i);
  });
});

describe('narrativeBridge2 — NarrativeBridge2 class', () => {
  test('emit calls the onBeat callback with the beat', () => {
    const onBeat = jest.fn();
    const bridge = new NarrativeBridge2(onBeat);
    const beat   = bridge.emit(BEAT_TYPE.BOARD_CLEAR);
    expect(onBeat).toHaveBeenCalledWith(beat);
    expect(onBeat).toHaveBeenCalledTimes(1);
  });

  test('emit stores the beat in history', () => {
    const bridge = new NarrativeBridge2();
    bridge.emit(BEAT_TYPE.LEVEL_UP, { level: 3 });
    expect(bridge.getHistory()).toHaveLength(1);
  });

  test('getHistory returns a copy, not the internal array', () => {
    const bridge  = new NarrativeBridge2();
    bridge.emit(BEAT_TYPE.MATCH, { element: 'aether', score: 100 });
    const history = bridge.getHistory();
    history.push('intruder');
    expect(bridge.getHistory()).toHaveLength(1);
  });

  test('clearHistory empties the beat log', () => {
    const bridge = new NarrativeBridge2();
    bridge.emit(BEAT_TYPE.MATCH, { element: 'umbra', score: 50 });
    bridge.emit(BEAT_TYPE.CASCADE, { chain: 2, score: 100 });
    bridge.clearHistory();
    expect(bridge.getHistory()).toHaveLength(0);
  });

  test('works without an onBeat callback (defaults to no-op)', () => {
    const bridge = new NarrativeBridge2();
    expect(() => bridge.emit(BEAT_TYPE.BOARD_CLEAR)).not.toThrow();
  });
});
