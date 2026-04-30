/**
 * sevenStarNarrative2.js — V2 Omen Unlock System
 * Listens to conscience stat changes and unlocks lore fragments
 * when thresholds are crossed, emitting narrative beats via NarrativeBridge2.
 * (c) 2026 NicholaiMadias — MIT License
 */

import { LORE_FRAGMENTS } from './loreModule2.js';
import { BEAT_TYPE } from './narrativeBridge2.js';

/**
 * SevenStarNarrative2 — manages omen discovery based on conscience thresholds.
 */
export class SevenStarNarrative2 {
  /**
   * @param {import('./narrativeBridge2.js').NarrativeBridge2} [bridge]
   */
  constructor(bridge) {
    this._bridge   = bridge || null;
    this._unlocked = new Set();
    this._omens    = this._buildOmenList();
  }

  /** Builds an ordered list of threshold-based omens from loreModule2. */
  _buildOmenList() {
    return LORE_FRAGMENTS
      .filter(f => f.stat && typeof f.threshold === 'number')
      .sort((a, b) => a.threshold - b.threshold);
  }

  /**
   * Checks conscience stats against all thresholds and unlocks new omens.
   * Emits OMEN (and FORGE_MOMENT for integrity fragments) via the bridge.
   *
   * @param {{ karma: number, wisdom: number, integrity: number, community: number }} conscience
   * @returns {Array<import('./loreModule2.js').LoreFragment>} Newly unlocked fragments
   */
  checkThresholds(conscience) {
    const newlyUnlocked = [];

    this._omens.forEach(fragment => {
      const { id, stat, threshold } = fragment;
      if (!this._unlocked.has(id) && (conscience[stat] || 0) >= threshold) {
        this._unlocked.add(id);
        newlyUnlocked.push(fragment);

        if (this._bridge) {
          this._bridge.emit(BEAT_TYPE.OMEN, {
            title: fragment.title,
            text:  fragment.text,
            id:    fragment.id,
          });
          if (stat === 'integrity') {
            this._bridge.emit(BEAT_TYPE.FORGE_MOMENT, { fragment: fragment.text });
          }
        }
      }
    });

    return newlyUnlocked;
  }

  /**
   * Returns all lore fragments that have been unlocked so far.
   * @returns {Array<import('./loreModule2.js').LoreFragment>}
   */
  getUnlocked() {
    return LORE_FRAGMENTS.filter(f => this._unlocked.has(f.id));
  }

  /**
   * Returns the count of unlocked fragments.
   * @returns {number}
   */
  getUnlockedCount() {
    return this._unlocked.size;
  }

  /** Resets all unlocked omens (e.g., on new game). */
  reset() {
    this._unlocked.clear();
  }
}
