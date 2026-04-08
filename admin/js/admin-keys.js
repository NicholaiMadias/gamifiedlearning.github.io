/**
 * admin-keys.js
 * Admin Key Generator + Redemption logic.
 * Keys are stored in localStorage under 'matrix_admin_keys'.
 * Replace storage calls with Firebase writes in production.
 */

const KEYS_STORE = 'matrix_admin_keys';

function loadKeys() {
  try { return JSON.parse(localStorage.getItem(KEYS_STORE) || '{}'); }
  catch { return {}; }
}

function saveKeys(keys) {
  localStorage.setItem(KEYS_STORE, JSON.stringify(keys));
}

/**
 * Generate a cryptographically random key string.
 * Format: MTRX-XXXX-XXXX-XXXX
 */
function generateKeyString() {
  const seg = () =>
    Array.from(crypto.getRandomValues(new Uint8Array(2)))
      .map(b => b.toString(16).padStart(2, '0').toUpperCase())
      .join('');
  return `MTRX-${seg()}-${seg()}-${seg()}`;
}

/**
 * Create and store a new admin key.
 *
 * @param {string} purpose  - Human-readable label for this key.
 * @param {string} createdBy - UID of the super admin generating the key.
 * @returns {{ key: string, purpose: string, createdAt: string, used: boolean }}
 */
export function generateAdminKey(purpose, createdBy) {
  const key  = generateKeyString();
  const keys = loadKeys();
  keys[key] = {
    purpose:   purpose || 'Unspecified',
    createdBy: createdBy || 'unknown',
    createdAt: new Date().toISOString(),
    used:      false,
    usedBy:    null,
    usedAt:    null,
  };
  saveKeys(keys);
  return { key, ...keys[key] };
}

/**
 * Redeem an admin key.
 * On success, upgrades the current user's role to 'admin'.
 *
 * @param {object} db     - Firebase db instance (or shim) for role update.
 * @param {string} keyStr - The key string entered by the user.
 * @param {object} user   - Current user session { uid, email, role }.
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function redeemAdminKey(db, keyStr, user) {
  const keys = loadKeys();
  const entry = keys[keyStr.trim().toUpperCase()];

  if (!entry)       return { success: false, message: 'Invalid key.' };
  if (entry.used)   return { success: false, message: 'Key already used.' };

  // Mark as used
  entry.used   = true;
  entry.usedBy = user.uid;
  entry.usedAt = new Date().toISOString();
  saveKeys(keys);

  // Upgrade role in DB
  try {
    await db.ref(`users/${user.uid}`).update({ role: 'admin' });
    return { success: true, message: `Key redeemed. Role upgraded to admin.` };
  } catch (err) {
    return { success: false, message: `DB error: ${err.message}` };
  }
}

/**
 * List all admin keys (for the UI table).
 * @returns {Array<{ key: string, purpose: string, createdAt: string, used: boolean }>}
 */
export function listAdminKeys() {
  const keys = loadKeys();
  return Object.entries(keys).map(([key, meta]) => ({ key, ...meta }));
}
