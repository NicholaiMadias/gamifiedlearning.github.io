/**
 * Player model for the AmazingGraceHomeLiving store.
 * Stores credits, points, and donation amounts.
 *
 * Credit rules:
 *   1 credit per 1 point earned
 *   300 credits per $1 donated
 */

'use strict';

const CREDITS_PER_POINT = 1;
const CREDITS_PER_DOLLAR = 300;

/**
 * In-memory player store (keyed by player ID).
 * Replace with a real database in production.
 */
const players = new Map();

class Player {
  constructor(id, { credits = 0, points = 0, donated = 0 } = {}) {
    this.id = id;
    this.credits = credits;
    this.points = points;
    this.donated = donated;
  }

  /** Recalculate and set credits based on current points and donated amount. */
  recalculate() {
    this.credits =
      this.points * CREDITS_PER_POINT +
      Math.floor(this.donated * CREDITS_PER_DOLLAR);
    return this.credits;
  }

  toJSON() {
    return {
      id: this.id,
      credits: this.credits,
      points: this.points,
      donated: this.donated,
    };
  }
}

/**
 * Find or create a player by ID.
 * @param {string} playerId
 * @returns {Player}
 */
function findOrCreate(playerId) {
  if (!players.has(playerId)) {
    players.set(playerId, new Player(playerId));
  }
  return players.get(playerId);
}

/**
 * Get a player by ID. Returns null if not found.
 * @param {string} playerId
 * @returns {Player|null}
 */
function getPlayer(playerId) {
  return players.get(playerId) || null;
}

module.exports = { Player, findOrCreate, getPlayer, CREDITS_PER_POINT, CREDITS_PER_DOLLAR };
