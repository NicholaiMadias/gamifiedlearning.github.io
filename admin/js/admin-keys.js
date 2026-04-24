/**
 * admin-keys.js
 * Admin Key Generator + Redemption logic.
 * Keys are stored in localStorage under 'matrix_admin_keys'.
 * Replace storage calls with Firebase writes in production.
 */

const KEYS_STORE = 'matrix_admin_keys';

/** Numeric rank for role comparisons (higher = more privileged) */
const ROLE_RANK = { user: 0, admin: 1, superAdmin: 2, owner: 3 };

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
 * Redeem an admin key on behalf of a target user (identified by email).
 * The key grants the target user the 'admin' role.
 * Users who already hold 'admin' or a higher role are not affected.
 *
 * @param {object} db          - Firebase db instance (or shim) for role update.
 * @param {string} keyStr      - The key string entered by the operator.
 * @param {string} targetEmail - Email of the user to be upgraded.
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function redeemAdminKey(db, keyStr, targetEmail) {
  const keys  = loadKeys();
  const entry = keys[keyStr.trim().toUpperCase()];

  if (!entry)     return { success: false, message: 'Invalid key.' };
  if (entry.used) return { success: false, message: 'Key already used.' };

  // Locate the target user by email in the database
  const snap = await db.ref('users').get();
  let targetUid  = null;
  let targetRole = null;
  snap.forEach(child => {
    if (child.val().email?.toLowerCase() === targetEmail.trim().toLowerCase()) {
      targetUid  = child.key;
      targetRole = child.val().role;
    }
  });

  if (!targetUid) return { success: false, message: 'No account found for that email.' };

  // Prevent accidental downgrade of already-privileged accounts
  if ((ROLE_RANK[targetRole] ?? 0) >= ROLE_RANK.admin) {
    return { success: false, message: `${targetEmail} already holds '${targetRole}' or higher.` };
  }

  // Upgrade role first — only persist key usage on success
  try {
    await db.ref(`users/${targetUid}`).update({ role: 'admin' });
  } catch (err) {
    return { success: false, message: `DB error: ${err.message}` };
  }

  entry.used   = true;
  entry.usedBy = targetUid;
  entry.usedAt = new Date().toISOString();
  saveKeys(keys);

  return { success: true, message: `Key redeemed. ${targetEmail} upgraded to admin.` };
}

/**
 * List all admin keys (for the UI table).
 * @returns {Array<{ key: string, purpose: string, createdAt: string, used: boolean }>}
 */
export function listAdminKeys() {
  const keys = loadKeys();
  return Object.entries(keys).map(([key, meta]) => ({ key, ...meta }));
}
