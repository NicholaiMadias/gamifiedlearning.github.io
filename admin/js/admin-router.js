/**
 * admin-router.js
 * Role-based routing guard for the Sovereign Matrix Admin Dashboard.
 *
 * Usage:
 *   import { requireRole, getCurrentUser } from './admin-router.js';
 *   requireRole(['admin', 'superAdmin', 'owner']);
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
 * Redirects to /admin/login.html if unauthenticated,
 * or /admin/forbidden.html if the user lacks the required role.
 *
 * @param {string[]} allowedRoles - Array of roles that may access this page.
 * @returns {{ uid: string, email: string, role: string } | null} The authenticated user, or null if redirected.
 */
export function requireRole(allowedRoles) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = '/admin/login.html';
    return null;
  }
  if (!allowedRoles.includes(user.role)) {
    window.location.href = '/admin/forbidden.html';
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
