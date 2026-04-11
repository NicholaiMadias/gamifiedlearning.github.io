/**
 * admin-tools-assign.js
 * Low-level Firebase operations for assigning / revoking tools.
 */

/**
 * Set (or clear) a tool flag for a given user.
 *
 * @param {object} db      - Firebase Realtime Database instance (or shim).
 * @param {string} uid     - User ID.
 * @param {string} tool    - Tool key (e.g. "networkDefense", "diagnostics", "nations").
 * @param {boolean} enabled - Whether to grant (true) or revoke (false) the tool.
 */
export async function setUserTool(db, uid, tool, enabled) {
  await db.ref(`users/${uid}/tools/${tool}`).set(enabled);
}

/**
 * Batch-assign multiple tools to a user.
 *
 * @param {object} db
 * @param {string} uid
 * @param {Record<string, boolean>} toolMap - e.g. { networkDefense: true, diagnostics: false }
 */
export async function setUserTools(db, uid, toolMap) {
  const updates = {};
  for (const [tool, enabled] of Object.entries(toolMap)) {
    updates[`${uid}/tools/${tool}`] = enabled;
  }
  await setUserToolsBatch(db, updates);
}

/**
 * Apply multiple tool updates across users using a single multipath update
 * when available, falling back to small concurrent sets to avoid rate limits.
 *
 * @param {object} db
 * @param {Record<string, boolean>} updates - keys relative to "users/", e.g. { "uid/tools/diagnostics": true }
 */
export async function setUserToolsBatch(db, updates) {
  const entries = Object.entries(updates);
  if (entries.length === 0) return;

  const ref = db.ref ? db.ref('users') : null;
  if (ref && typeof ref.update === 'function') {
    await ref.update(updates);
    return;
  }

  const chunkSize = 10;
  for (let i = 0; i < entries.length; i += chunkSize) {
    const chunk = entries.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(([relPath, value]) =>
        db.ref(relPath.startsWith('users/') ? relPath : `users/${relPath}`).set(value)
      )
    );
  }
}
