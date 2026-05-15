import gameConfig from '../config/gameConfig.json' with { type: 'json' };

/**
 * Returns the combo reward for the given chain length, or null if no tier is met.
 * Tiers are evaluated in descending order of their chain threshold so the highest
 * matching tier always wins — no manual ordering required when config changes.
 *
 * @param {number} chain - Number of consecutive matches in the chain.
 * @returns {{ xpMultiplier: number, fx?: string, powerUp?: string } | null}
 */
export function getComboReward(chain) {
  const tiers = Object.values(gameConfig.combos)
    .sort((a, b) => b.chain - a.chain);

  const matched = tiers.find(tier => chain >= tier.chain);
  return matched ? matched.reward : null;
}
