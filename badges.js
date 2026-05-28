/**
 * badges.js — 6-Tier Badge Award System
 * (c) 2026 NicholaiMadias — MIT License
 */

import { recordLevelComplete } from './progression.js';

const BADGE_TIERS = [
  { level: 1,  name: 'Seedling',  emoji: '🌱', desc: 'Planted the first seed of knowledge' },
  { level: 3,  name: 'Charged',   emoji: '⚡',  desc: 'Electrified by curiosity' },
  { level: 5,  name: 'On Fire',   emoji: '🔥', desc: 'Burning through challenges' },
  { level: 8,  name: 'Diamond',   emoji: '💎', desc: 'Unbreakable focus and clarity' },
  { level: 12, name: 'Champion',  emoji: '🏆', desc: 'Master of the Matrix' },
  { level: 15, name: 'Supernova', emoji: '🌟', desc: 'Cosmic energy — the stars align for you' }
];

let earnedBadges = [];
// Initialise from localStorage immediately so earnedBadges is always in sync
// before any onLevelComplete() call — prevents badges re-triggering on reload.
loadBadges();

function showBadgeBanner(badge) {
  const banner = document.getElementById('match-badge-banner');
  if (!banner) return;
  banner.textContent = badge.emoji + ' Badge Unlocked: ' + badge.name + ' — ' + badge.desc;
  banner.classList.remove('hidden');
  banner.setAttribute('aria-live', 'polite');
  setTimeout(() => banner.classList.add('hidden'), 4000);
}

export function onLevelComplete(completedLevel, currentScore, db, user) {
  recordLevelComplete(completedLevel);
  BADGE_TIERS.forEach(badge => {
    if (completedLevel >= badge.level && !earnedBadges.includes(badge.name)) {
      earnedBadges.push(badge.name);
      showBadgeBanner(badge);
      try { localStorage.setItem('glm-badges', JSON.stringify(earnedBadges)); } catch (e) {}
    }
  });
}

export function loadBadges() {
  try {
    const s = localStorage.getItem('glm-badges');
    if (!s) {
      earnedBadges = [];
    } else {
      const parsed = JSON.parse(s);
      earnedBadges = Array.isArray(parsed) ? parsed.filter(b => typeof b === 'string') : [];
    }
  } catch (e) {
    earnedBadges = [];
  }
  return earnedBadges;
}

export function resetBadges() {
  earnedBadges = [];
  try { localStorage.removeItem('glm-badges'); } catch (e) {}
}

export { BADGE_TIERS };
