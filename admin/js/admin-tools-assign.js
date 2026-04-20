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
 * Batch-assign multiple tools to a user in a single write.
 *
 * @param {object} db
 * @param {string} uid
 * @param {Record<string, boolean>} toolMap - e.g. { networkDefense: true, diagnostics: false }
 */
export async function setUserTools(db, uid, toolMap) {
  await db.ref(`users/${uid}/tools`).update(toolMap);
}
