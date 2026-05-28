/**
 * admin-router.js
 * Navigation + light access utilities for the Sovereign Matrix Public Toolbox.
 *
 * NOTE:
 * This repository is public and is deployed on GitHub Pages.
 * Any code under /public is downloadable by all visitors.
 * Do NOT place real administrative or privileged features here.
 *
 * Usage:
 *   import { injectToolboxSidebar } from './admin-router.js';
 *   injectToolboxSidebar();
 */

// Ensure the icon web component is registered on pages that import this module.
import '/assets/js/nexus-icon.js';

/**
 * Return the currently authenticated user from localStorage.
 * Defaults to a guest session so pages load without login.
 * All content under /public is publicly downloadable; this is a read-only
 * toolbox with no privileged back-end operations.
 * @returns {{ uid: string, email: string, role: string }}
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem('adminUser');
    if (raw) return JSON.parse(raw);
  } catch { /* ignored */ }
  return { uid: 'guest', email: 'guest@local', role: 'guest' };
}

/**
 * Persist a user session to localStorage.
 * @param {{ uid: string, email: string, role: string }} user
 */
export function setCurrentUser(user) {
  try {
    localStorage.setItem('adminUser', JSON.stringify(user));
  } catch { /* storage blocked */ }
}

/**
 * Clear the current user session and redirect to the admin dashboard.
 */
export function logout() {
  try { localStorage.removeItem('adminUser'); } catch { /* ignored */ }
  window.location.href = '/admin/index.html';
}

/**
 * Guard the current page by required roles.
 * This is a no-auth stub: no real access control is enforced.
 * All pages under /public are publicly accessible by design.
 * Role gates are preserved for call-site compatibility only.
 *
 * @param {string[]} _allowedRoles  (not enforced — public toolbox)
 * @returns {{ uid: string, email: string, role: string }}
 */
export function requireRole(_allowedRoles) {
  return getCurrentUser();
}

/**
 * No-op stub kept for call-site compatibility.
 * Firebase Auth integration has been removed from the public toolbox.
 * @returns {Promise<null>}
 */
export function initFirebaseAuth() {
  return Promise.resolve(null);
}

/**
 * Role constants kept for call-site compatibility.
 */
export const ROLES = {
  ALL_ADMIN:  ['admin', 'superAdmin', 'owner'],
  SUPER_PLUS: ['superAdmin', 'owner'],
  OWNER_ONLY: ['owner'],
};

/**
 * Inject a hidden "System Override" trigger and Master Key modal into the page.
 *
 * This is intentionally a harmless stub in the public toolbox.
 */
export function injectMasterKeyModal() {
  // Intentionally disabled in public toolbox build.
}

/**
 * Inject the standardized Toolbox Sidebar into the page.
 * Uses the <nexus-icon> web component for clean SVG handling.
 *
 * Usage:
 *   import { injectToolboxSidebar } from '/admin/js/admin-router.js';
 *   injectToolboxSidebar();
 */
export function injectToolboxSidebar(options = {}) {
  const {
    mountSelector = 'body',
    prepend = true,
    headerText = 'MATRIX TOOLBOX',
  } = options;

  if (document.querySelector('nav.toolbox-sidebar')) return;

  const mount = document.querySelector(mountSelector);
  if (!mount) return;

  const nav = document.createElement('nav');
  nav.className = 'toolbox-sidebar';

  nav.innerHTML = `
    <div class="sidebar-header">${headerText}</div>

    <a href="/admin/network-defense.html" class="nav-btn" data-path="/admin/network-defense.html">
      <nexus-icon name="icon-defense"></nexus-icon>
      <span>Vision (Defense)</span>
    </a>

    <a href="/admin/keys.html" class="nav-btn" data-path="/admin/keys.html">
      <nexus-icon name="icon-key"></nexus-icon>
      <span>Courage (Keys)</span>
    </a>

    <a href="/admin/diagnostics.html" class="nav-btn" data-path="/admin/diagnostics.html">
      <nexus-icon name="icon-diag"></nexus-icon>
      <span>Sustenance (Diag)</span>
    </a>
  `;

  // Active route highlighting (strict match on pathname)
  const curPath = window.location.pathname;
  nav.querySelectorAll('a.nav-btn').forEach(a => {
    try {
      const hrefPath = new URL(a.getAttribute('href') || '', window.location.origin).pathname;
      if (hrefPath === curPath) a.classList.add('active');
    } catch { /* ignore */ }
  });

  if (prepend) mount.prepend(nav);
  else mount.appendChild(nav);

  // Trigger layout shift
  document.body.classList.add('has-sidebar');
}

/**
 * Backwards-compatible export name so existing pages don't break.
 * Prefer injectToolboxSidebar going forward.
 */
export const injectAdminSidebar = injectToolboxSidebar;
