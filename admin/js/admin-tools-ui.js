/**
 * admin-tools-ui.js
 * Renders the Super Admin Tool Assignment panel and persists changes.
 */

import { setUserTools } from './admin-tools-assign.js';

const TOOLS = [
  { key: 'networkDefense', label: 'Network Defense' },
  { key: 'diagnostics',    label: 'Diagnostics Console' },
  { key: 'nations',        label: 'Nations Simulator' },
];

/** XSS-safe string escaper */
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Render the tool-assignment table into #user-tools-body and wire the
 * "Save Assignments" button.
 *
 * @param {object} db - Firebase Realtime Database instance (or shim).
 */
export async function renderToolAssignment(db) {
  const snap  = await db.ref('users').get();
  const tbody = document.getElementById('user-tools-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  snap.forEach(child => {
    const u   = child.val();
    const uid = child.key;
    const userIdentifier = u.email || uid;

    const checkboxes = TOOLS.map(t => {
      const checked = u.tools?.[t.key] ? 'checked' : '';
      const ariaLabel = `Assign ${t.label} to ${userIdentifier}`;
      return `<td><input type="checkbox"
                data-uid="${esc(uid)}"
                data-tool="${esc(t.key)}"
                aria-label="${esc(ariaLabel)}"
                ${checked}></td>`;
    }).join('');

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${esc(u.email)}</td>
      <td>${esc(u.role)}</td>
      ${checkboxes}
    `;
    tbody.appendChild(row);
  });

  const saveBtn = document.getElementById('save-tools');
  if (!saveBtn) return;

  saveBtn.onclick = async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    try {
      // Group checkbox state by uid so each user gets one batched write
      const boxes = Array.from(document.querySelectorAll('input[data-tool]'));
      const byUid = {};
      boxes.forEach(box => {
        const uid = box.dataset.uid;
        if (!byUid[uid]) byUid[uid] = {};
        byUid[uid][box.dataset.tool] = box.checked;
      });
      await Promise.all(
        Object.entries(byUid).map(([uid, toolMap]) => setUserTools(db, uid, toolMap))
      );
      showStatus('Tool assignments saved.');
    } catch (err) {
      showStatus(`Error: ${err.message}`, true);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Assignments';
    }
  };
}

function showStatus(msg, isError = false) {
  const el = document.getElementById('tools-status');
  if (!el) return;
  el.textContent = msg;
  el.className = `matrix-alert${isError ? ' error' : ''}`;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3500);
}
