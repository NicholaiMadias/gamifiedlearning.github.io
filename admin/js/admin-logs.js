/**
 * admin-logs.js
 * Audit log reader for the Sovereign Matrix Admin Dashboard.
 * Logs are stored in localStorage under 'matrix_audit_logs'.
 * Replace with Firebase reads in production.
 */

const LOGS_STORE = 'matrix_audit_logs';
let logTableBody;

/**
 * Polyfill for crypto.randomUUID() — falls back to getRandomValues on older browsers.
 * @returns {string} A version-4 UUID string.
 */
function randomUUID() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // RFC-4122 v4 UUID via getRandomValues
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant bits
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

/**
 * Record a new audit log entry.
 * Called internally by other modules (or Firebase Cloud Functions in prod).
 *
 * @param {string} action - The action type (e.g. 'LOGIN', 'ROLE_CHANGE').
 * @param {string} uid - The user ID performing the action.
 * @param {string} [detail] - Optional detail string.
 */
export function logEvent(action, uid, detail = '') {
  const logs = loadLogs();
  logs.unshift({
    id:        randomUUID(),
    action,
    uid,
    detail,
    timestamp: new Date().toISOString(),
  });
  // Keep last 500 entries
  if (logs.length > 500) logs.length = 500;
  localStorage.setItem(LOGS_STORE, JSON.stringify(logs));
}

function loadLogs() {
  try { return JSON.parse(localStorage.getItem(LOGS_STORE) || '[]'); }
  catch { return []; }
}

/**
 * Render audit logs into #log-table-body.
 *
 * @param {object} _db - Unused in shim; pass Firebase db in production.
 * @param {{ limit?: number, filterAction?: string }} opts
 */
export async function renderAuditLogs(_db, opts = {}) {
  const tbody = getLogTableBody();
  if (!tbody) return;

  let logs = loadLogs();

  if (opts.filterAction) {
    const normalizedFilter = opts.filterAction.toLowerCase();
    logs = logs.filter(l =>
      l.action.toLowerCase().includes(normalizedFilter)
    );
  }

  const limit = opts.limit ?? 200;
  logs = logs.slice(0, limit);

  if (logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#555">No log entries found.</td></tr>';
    return;
  }

  tbody.innerHTML = logs.map(l => `
    <tr>
      <td>${new Date(l.timestamp).toLocaleString()}</td>
      <td>${esc(l.action)}</td>
      <td>${esc(l.uid)}</td>
      <td>${esc(l.detail)}</td>
    </tr>
  `).join('');
}

function getLogTableBody() {
  if (!logTableBody) {
    logTableBody = document.getElementById('log-table-body');
  }

  return logTableBody;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Seed a few demo log entries if the store is empty */
export function seedDemoLogs() {
  const existing = loadLogs();
  if (existing.length > 0) return;
  const demos = [
    { action: 'LOGIN',       uid: 'uid_owner_001',  detail: 'owner@matrix.dev logged in' },
    { action: 'ROLE_CHANGE', uid: 'uid_super_002',  detail: 'Changed uid_admin_003 role to superAdmin' },
    { action: 'KEY_GEN',     uid: 'uid_super_002',  detail: 'Generated key MTRX-AA00-BB11-CC22' },
    { action: 'TOOL_ASSIGN', uid: 'uid_owner_001',  detail: 'Assigned diagnostics to uid_user_004' },
    { action: 'LOGOUT',      uid: 'uid_admin_003',  detail: 'admin@matrix.dev logged out' },
  ];
  demos.forEach(d => logEvent(d.action, d.uid, d.detail));
}
