/**
 * admin-users.js
 * Renders the User Management table and handles role updates.
 *
 * @param {object} db - Firebase Realtime Database instance (or shim).
 * @param {object} currentUser - The authenticated admin user.
 */

const ROLE_ORDER = ['owner', 'superAdmin', 'admin', 'user'];

/** Tracks whether the delegated change listener has been attached */
let _changeListenerAttached = false;

/**
 * Build a role badge HTML string.
 */
function roleBadge(role) {
  const cls = {
    owner:      'role-owner',
    superAdmin: 'role-superAdmin',
    admin:      'role-admin',
    user:       'role-user',
  }[role] || 'role-user';
  const span = document.createElement('span');
  span.className = `role-badge ${cls}`;
  span.textContent = role;
  return span.outerHTML;
}

/**
 * Build a role <select> for inline editing (owner/superAdmin only).
 */
function roleSelect(uid, currentRole, editable) {
  if (!editable) return roleBadge(currentRole);
  const options = ROLE_ORDER.map(r =>
    `<option value="${escapeHtml(r)}" ${r === currentRole ? 'selected' : ''}>${escapeHtml(r)}</option>`
  ).join('');
  return `<select class="matrix-input" style="max-width:130px;margin:0;padding:0.25rem 0.5rem"
            data-uid="${escapeHtml(uid)}" data-field="role">${options}</select>`;
}

/**
 * Fetch all users and render them into #user-table-body.
 *
 * @param {object} db
 * @param {object} currentUser
 */
export async function renderUserTable(db, currentUser) {
  const snap = await db.ref('users').get();
  const tbody = document.getElementById('user-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  const canEditRole = ['superAdmin', 'owner'].includes(currentUser?.role);

  snap.forEach(child => {
    const u = child.val();
    const uid = child.key;

    const badgeCount = Object.keys(u.badges || {}).length;
    const toolList   = Object.entries(u.tools || {})
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(', ') || '—';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(u.email)}</td>
      <td>${roleSelect(uid, u.role, canEditRole)}</td>
      <td>${badgeCount}</td>
      <td>$${Number(u.donations || 0).toFixed(2)}</td>
      <td>${escapeHtml(toolList)}</td>
    `;
    tbody.appendChild(row);
  });

  // Attach the delegated role-change handler only once per page lifetime
  if (canEditRole && !_changeListenerAttached) {
    _changeListenerAttached = true;
    tbody.addEventListener('change', async e => {
      const sel = e.target;
      if (sel.dataset.field !== 'role') return;
      const uid  = sel.dataset.uid;
      const role = sel.value;
      try {
        await db.ref(`users/${uid}`).update({ role });
        showStatus(`Role updated for ${uid}.`);
      } catch (err) {
        showStatus(`Error: ${err.message}`, true);
        await renderUserTable(db, currentUser); // revert UI
      }
    });
  }
}

/** Tiny XSS-safe helper */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showStatus(msg, isError = false) {
  const el = document.getElementById('user-status');
  if (!el) return;
  el.textContent = msg;
  el.className = `matrix-alert${isError ? ' error' : ''}`;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}
