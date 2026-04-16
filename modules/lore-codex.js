console.log('[NexusOS] lore-codex module loaded');

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'modules/lore-codex.css';
document.head.appendChild(link);

const STORAGE_KEY = 'nexus_lore_unlocked';
let unlocked = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let allEntries = [];

async function loadEntries() {
  try {
    const data = await fetch('config/lore.json').then(r => r.json());
    allEntries = data.entries || [];
    renderEntries(allEntries);
  } catch {
    // Fallback built-in entries
    allEntries = [
      { id: 'nexus-origin', title: 'The Origin of Nexus', body: 'Before the stars aligned, the Nexus existed as pure potential — an infinite arcade waiting to be born.' },
      { id: 'seven-seals',  title: 'The Seven Seals',    body: 'Seven stars, seven churches, seven seals. Each star unlocked reveals a deeper truth about the nature of the realm.' },
    ];
    renderEntries(allEntries);
  }
}

function renderEntries(entries) {
  const list = document.getElementById('lore-list');
  if (!list) return;

  const visible = entries.filter(e => unlocked.length === 0 || unlocked.includes(e.id));
  if (visible.length === 0) {
    list.innerHTML = '<p class="lore-empty">No entries unlocked yet. Keep exploring!</p>';
    return;
  }
  list.innerHTML = visible.map(e => `
    <article class="lore-entry" role="listitem">
      <h3>${e.title}</h3>
      <p>${e.body}</p>
    </article>
  `).join('');
}

document.getElementById('lore-search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  const filtered = allEntries.filter(en =>
    en.title.toLowerCase().includes(q) || en.body.toLowerCase().includes(q)
  );
  renderEntries(filtered);
});

// Unlock all entries when lore-codex is first accessed
if (unlocked.length === 0) {
  // Auto-unlock the first two entries
  unlocked = ['nexus-origin', 'seven-seals'];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
}

NexusOS.on('lore-unlock', ({ id }) => {
  if (!unlocked.includes(id)) {
    unlocked.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
    renderEntries(allEntries);
  }
});

loadEntries();
