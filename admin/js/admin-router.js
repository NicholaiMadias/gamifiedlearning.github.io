/**
 * admin-router.js
 * Role-based routing guard for the Sovereign Matrix Admin Dashboard.
 *
 * Usage:
 *   import { requireRole, getCurrentUser } from './admin-router.js';
 *   requireRole(['admin', 'superAdmin', 'owner']);
 *
 * ⚠️  SECURITY NOTE — DEMO MODE ONLY
 * Access control here is enforced purely client-side: roles are read from
 * localStorage ('adminUser'), which any user can edit in browser devtools.
 * This is intentional for local/preview environments only.
 *
 * For production (admin.gamifiedlearning.org) you MUST:
 *  1. Enable Firebase Authentication and issue ID tokens.
 *  2. Store roles as Firebase Auth custom claims (not in localStorage).
 *  3. Enforce access via Firebase Realtime Database / Firestore security rules
 *     so that privileged reads/writes are validated server-side.
 *  4. Replace the localStorage shim in auth.js with real Firebase SDK calls.
 */

/**
 * Return the currently authenticated user from localStorage.
 * Returns null if no session exists.
 * @returns {{ uid: string, email: string, role: string }|null}
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem('adminUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persist a user session to localStorage.
 * @param {{ uid: string, email: string, role: string }} user
 */
export function setCurrentUser(user) {
  localStorage.setItem('adminUser', JSON.stringify(user));
}

/**
 * Clear the current user session and redirect to login.
 */
export function logout() {
  localStorage.removeItem('adminUser');
  window.location.href = '/admin/login.html';
}

/**
 * Guard the current page by required roles.
 * Redirects to /admin/login.html if unauthenticated or if the user
 * lacks the required role.
 *
 * ⚠️  Demo-only: role is read from localStorage and can be spoofed.
 *     Back every privileged operation with Firebase security rules in production.
 *
 * @param {string[]} allowedRoles - Array of roles that may access this page.
 * @returns {{ uid: string, email: string, role: string }|null} The authenticated user, or null after redirect if unauthenticated or unauthorized.
 */
export function requireRole(allowedRoles) {
  // Warn developers when this client-side guard runs in a production context.
  const h = location.hostname;
  const isProduction =
    h !== '' &&
    h !== 'localhost' &&
    h !== '127.0.0.1' &&
    !h.endsWith('.github.io');
  if (isProduction) {
    console.warn(
      '[admin-router] requireRole() is a client-side demo guard. ' +
      'Enforce access with Firebase Auth custom claims + RTDB/Firestore security rules in production.'
    );
  }

  const user = getCurrentUser();
  if (!user) {
    window.location.href = '/admin/login.html';
    return null;
  }
  if (!allowedRoles.includes(user.role)) {
    window.location.href = '/admin/login.html?reason=insufficient_role';
    return null;
  }
  return user;
}

/**
 * Convenience helpers for specific role checks.
 */
export const ROLES = {
  ALL_ADMIN:  ['admin', 'superAdmin', 'owner'],
  SUPER_PLUS: ['superAdmin', 'owner'],
  OWNER_ONLY: ['owner'],
};
