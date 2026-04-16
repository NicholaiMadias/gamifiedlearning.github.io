import gameConfig from '../config/gameConfig.json' assert { type: 'json' };

/**
 * Returns the combo reward for the given chain length, or null if no tier is met.
 *
 * @param {number} chain - Number of consecutive matches in the chain.
 * @returns {{ xpMultiplier: number, fx?: string, powerUp?: string } | null}
 */
export function getComboReward(chain) {
  const combos = gameConfig.combos;

  if (chain >= combos.tier4.chain) return combos.tier4.reward;
  if (chain >= combos.tier3.chain) return combos.tier3.reward;
  if (chain >= combos.tier2.chain) return combos.tier2.reward;
  if (chain >= combos.tier1.chain) return combos.tier1.reward;

  return null;
}
