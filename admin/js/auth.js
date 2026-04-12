/**
 * auth.js
 * Thin authentication helper for the Admin Dashboard.
 *
 * In production this module bridges Firebase Auth + Realtime Database.
 * For local / demo use it falls back to localStorage so the UI works
 * without a live Firebase project.
 */

import { setCurrentUser, logout } from './admin-router.js';

/* ── Firebase stub ──────────────────────────────────────────
   Replace the config object below with your actual project
   values and uncomment the real implementations.
   ─────────────────────────────────────────────────────────── */
// import { initializeApp }       from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
// import { getDatabase, ref, get, set } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
// import { getAuth, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
//
// const firebaseConfig = {
//   apiKey:            "YOUR_API_KEY",
//   authDomain:        "YOUR_PROJECT.firebaseapp.com",
//   databaseURL:       "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
//   projectId:         "YOUR_PROJECT",
//   storageBucket:     "YOUR_PROJECT.appspot.com",
//   messagingSenderId: "YOUR_SENDER_ID",
//   appId:             "YOUR_APP_ID",
// };
// const app  = initializeApp(firebaseConfig);
// export const db   = getDatabase(app);
// export const auth = getAuth(app);

/* ── Demo / localStorage database shim ─────────────────────
   Provides a Firebase-compatible db.ref().get() API backed
   by localStorage so the dashboard can be exercised without
   a live backend.
   ─────────────────────────────────────────────────────────── */

const DEMO_USERS_KEY = 'matrix_demo_users';

function getDemoUsers() {
  try {
    const raw = localStorage.getItem(DEMO_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDemoUsers(users) {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
}

function seedDemoUsers() {
  const existing = getDemoUsers();
  if (Object.keys(existing).length > 0) return;
  const seed = {
    uid_owner_001: {
      email: 'owner@matrix.dev',
      role: 'owner',
      badges: { badge_01: true, badge_02: true },
      donations: 120,
      tools: { networkDefense: true, diagnostics: true, nations: true },
    },
    uid_super_002: {
      email: 'superadmin@matrix.dev',
      role: 'superAdmin',
      badges: { badge_01: true },
      donations: 50,
      tools: { networkDefense: true, diagnostics: true, nations: false },
    },
    uid_admin_003: {
      email: 'admin@matrix.dev',
      role: 'admin',
      badges: {},
      donations: 15,
      tools: { networkDefense: false, diagnostics: true, nations: false },
    },
    uid_user_004: {
      email: 'user@matrix.dev',
      role: 'user',
      badges: {},
      donations: 0,
      tools: { networkDefense: false, diagnostics: false, nations: false },
    },
  };
  saveDemoUsers(seed);
}

/**
 * True when running on a local/dev/preview host.
 * Demo seeding and the permissive demo-login path are disabled on production
 * hostnames (e.g. admin.gamifiedlearning.org) so demo credentials are never
 * available on the live site.
 */
const IS_DEMO_HOST = (() => {
  const h = location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '' || h.endsWith('.github.io');
})();

if (IS_DEMO_HOST) seedDemoUsers();

/** Firebase-compatible database shim */
export const db = {
  ref(path) {
    return {
      async get() {
        const users = getDemoUsers();
        const parts = path.split('/');

        if (parts[0] !== 'users') {
          return { forEach() {}, val: () => null, exists: () => false };
        }

        // db.ref('users').get() — return all users
        if (parts.length === 1) {
          return {
            forEach(cb) {
              Object.entries(users).forEach(([key, val]) =>
                cb({ key, val: () => val })
              );
            },
            val: () => users,
            exists: () => Object.keys(users).length > 0,
          };
        }

        // db.ref('users/uid').get() — return single user
        const uid = parts[1];
        if (parts.length === 2) {
          const data = users[uid] ?? null;
          return {
            forEach(cb) { if (data) cb({ key: uid, val: () => data }); },
            val: () => data,
            exists: () => data !== null,
          };
        }

        // db.ref('users/uid/field/…').get() — walk nested properties
        let node = users[uid];
        for (let i = 2; i < parts.length && node !== undefined; i++) {
          node = node[parts[i]];
        }
        const value = node ?? null;
        return {
          forEach() {},
          val: () => value,
          exists: () => value !== null,
        };
      },
      async set(value) {
        const parts = path.split('/');
        if (parts[0] === 'users' && parts[1]) {
          const users = getDemoUsers();
          users[parts[1]] = users[parts[1]] || {};
          // Deep-set nested paths like users/uid/tools/networkDefense
          let obj = users[parts[1]];
          for (let i = 2; i < parts.length - 1; i++) {
            obj[parts[i]] = obj[parts[i]] || {};
            obj = obj[parts[i]];
          }
          obj[parts[parts.length - 1]] = value;
          saveDemoUsers(users);
        }
      },
      async update(updates) {
        const parts = path.split('/');
        if (parts[0] === 'users' && parts[1]) {
          const users = getDemoUsers();
          users[parts[1]] = users[parts[1]] || {};

          // Deep-merge at the referenced path, matching Firebase-style nested updates.
          let obj = users[parts[1]];
          for (let i = 2; i < parts.length; i++) {
            obj[parts[i]] = obj[parts[i]] || {};
            obj = obj[parts[i]];
          }

          const existingNode =
            obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
          const nextUpdates =
            updates && typeof updates === 'object' && !Array.isArray(updates) ? updates : {};

          if (parts.length === 2) {
            users[parts[1]] = { ...existingNode, ...nextUpdates };
          } else {
            const parent = users[parts[1]];
            let target = parent;
            for (let i = 2; i < parts.length - 1; i++) {
              target = target[parts[i]];
            }
            target[parts[parts.length - 1]] = { ...existingNode, ...nextUpdates };
          }
          saveDemoUsers(users);
        }
      },
    };
  },
};

/* ── Login helper ────────────────────────────────────────── */

/**
 * Authenticate with email + password.
 * Checks demo users store; replace with real Firebase Auth in production.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ uid: string, email: string, role: string }>}
 */
export async function loginWithEmail(email, password) {
  // Demo path: only active on local/preview hosts.
  // On production, this path is disabled so the shim accounts are never accessible.
  if (!IS_DEMO_HOST) {
    throw new Error('Live Firebase Auth is required on this host. In admin/js/auth.js, uncomment the Firebase imports and fill in firebaseConfig.');
  }

  // Demo: accept any non-empty password for seeded accounts
  const users = getDemoUsers();
  const entry = Object.entries(users).find(
    ([, u]) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (!entry) throw new Error('No account found for that email.');
  if (!password || password.length < 4) throw new Error('Invalid password.');

  // Allow any role to create a session; page-level guards and tool checks
  // enforce access after login (e.g. a 'user' with the diagnostics tool assigned
  // can log in here and be admitted by canAccessDiagnostics on that page).
  const [uid, user] = entry;

  const session = { uid, email: user.email, role: user.role };
  setCurrentUser(session);
  return session;
}

export { logout };
