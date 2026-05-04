import gameConfig from '../config/gameConfig.json' with { type: 'json' };

/**
 * Returns true when `stats` satisfies every sub-condition in `condition`.
 *
 * condition shape example:
 *   { combos: { tier1: 10 }, powerUps: { shootingStar: 5 } }
 *
 * stats shape example:
 *   { combos: { tier1: 12 }, powerUps: { shootingStar: 7 } }
 *
 * @param {object} stats
 * @param {object} condition
 * @returns {boolean}
 */
function meetsCondition(stats, condition) {
  return Object.entries(condition).every(([category, requirements]) => {
    const categoryStats = stats[category] || {};
    return Object.entries(requirements).every(
      ([key, threshold]) => (categoryStats[key] || 0) >= threshold
    );
  });
}

/**
 * Returns the ids of every badge whose unlock condition is met by `stats`.
 *
 * @param {{ combos?: object, powerUps?: object }} stats - Player progress counters.
 * @returns {string[]} Array of badge ids that should be unlocked.
 */
export function checkBadgeUnlocks(stats) {
  const badges = gameConfig.badges;

  return Object.entries(badges)
    .filter(([, rule]) => meetsCondition(stats, rule.condition))
    .map(([id]) => id);
}

/**
 * Returns the sprite path for a badge graphic.
 *
 * @param {string} badgeId - Badge id (e.g. "spark_initiate").
 * @returns {string | undefined}
 */
export function getBadgeSprite(badgeId) {
  return gameConfig.graphics.badges[badgeId];
}
