/**
 * badges.js — handles level completion and badge awarding.
 */

const LEVEL_BADGES = {
  1: { icon: '🌱', label: 'Seedling' },
  2: { icon: '⚡', label: 'Charged' },
  3: { icon: '🔥', label: 'On Fire' },
  4: { icon: '💎', label: 'Diamond' },
  5: { icon: '👑', label: 'Champion' },
};

/**
 * Called when a level is completed.
 * Shows a badge notification and optionally persists to the provided db/user.
 *
 * @param {number} level - The level that was completed
 * @param {number} score - The final score for the level
 * @param {object} [db]  - Optional Firebase / storage reference
 * @param {object} [user] - Optional user object
 */
export function onLevelComplete(level, score, db, user) {
  const badge = LEVEL_BADGES[level] || { icon: '🏅', label: `Level ${level}` };

  // Show in-game notification
  const banner = document.getElementById('match-badge-banner');
  if (banner) {
    banner.textContent = `${badge.icon} ${badge.label} badge unlocked! Score: ${score}`;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 3000);
  }

  // Persist if db and user are available
  if (db && user) {
    try {
      const ref = db.ref(`users/${user.uid}/badges/level_${level}`);
      ref.set({ level, badge: badge.label, score, earnedAt: Date.now() });
    } catch (e) {
      console.warn('Badge save failed:', e);
    }
  }
}
