/**
 * credits.js — shared client-side credit manager.
 *
 * Credit rules (mirrors backend/models/Player.js):
 *   1 credit per 1 point earned
 *   300 credits per $1 donated
 *
 * Storage: localStorage key 'nexus_credits'
 * Compatible with all static-site games (no backend required).
 */

'use strict';

const LS_KEY = 'nexus_credits';
const CREDITS_PER_POINT  = 1;
const CREDITS_PER_DOLLAR = 300;

/** Read the current credit balance. */
function getCredits() {
  try {
    return Math.max(0, parseInt(localStorage.getItem(LS_KEY) || '0', 10));
  } catch (_) {
    return 0;
  }
}

/** Persist a new balance. */
function _setCredits(amount) {
  try {
    localStorage.setItem(LS_KEY, String(Math.max(0, Math.round(amount))));
    _notify();
  } catch (_) { /* storage unavailable */ }
}

/** Award credits for game points earned. Returns the new total. */
function addCreditsForPoints(points) {
  if (!Number.isFinite(points) || points <= 0) return getCredits();
  const earned = Math.round(points * CREDITS_PER_POINT);
  const next   = getCredits() + earned;
  _setCredits(next);
  return next;
}

/**
 * Award credits for a donation amount (in dollars).
 * Returns the new total.
 */
function addCreditsForDonation(dollars) {
  if (!Number.isFinite(dollars) || dollars <= 0) return getCredits();
  const earned = Math.floor(dollars * CREDITS_PER_DOLLAR);
  const next   = getCredits() + earned;
  _setCredits(next);
  return next;
}

/**
 * Spend credits.  Returns true and deducts if sufficient balance; otherwise false.
 */
function spendCredits(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return false;
  const current = getCredits();
  if (current < amount) return false;
  _setCredits(current - amount);
  return true;
}

/* ── Change notifications ─────────────────────────────────────────── */
const _listeners = new Set();

function onCreditsChange(fn) {
  if (typeof fn === 'function') _listeners.add(fn);
  return () => _listeners.delete(fn);   // returns an unsubscribe function
}

function _notify() {
  const current = getCredits();
  _listeners.forEach(fn => {
    try { fn(current); } catch (_) {}
  });
  // Also emit a custom DOM event for components that prefer it
  try {
    window.dispatchEvent(new CustomEvent('nexus-credits-change', { detail: { credits: current } }));
  } catch (_) {}
}

/* ── Exports (works as ES module and via global window.NexusCredits) ── */
const NexusCredits = {
  getCredits,
  addCreditsForPoints,
  addCreditsForDonation,
  spendCredits,
  onCreditsChange,
  CREDITS_PER_POINT,
  CREDITS_PER_DOLLAR,
};

// ES module export (for import { ... } from '/credits.js')
export {
  getCredits,
  addCreditsForPoints,
  addCreditsForDonation,
  spendCredits,
  onCreditsChange,
  CREDITS_PER_POINT,
  CREDITS_PER_DOLLAR,
};

export default NexusCredits;

// Global fallback for non-module scripts (only set if not already defined)
if (typeof window !== 'undefined' && !window.NexusCredits) window.NexusCredits = NexusCredits;
