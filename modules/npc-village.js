console.log('[NexusOS] npc-village module loaded');

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'modules/npc-village.css';
document.head.appendChild(link);

const NPC_DIALOGUE = {
  sage: [
    'Welcome, traveler. The Seven Stars shine brighter because of you.',
    'Seek wisdom in the Lore Codex. It grows as you grow.',
    'Every combo you build brings you closer to revelation.'
  ],
  merchant: [
    'Looking for power-ups? I trade in rare items.',
    'Bring me badges and I\'ll show you something special.',
    'My rarest wares are reserved for those who reach the highest combos.'
  ],
  scribe: [
    'I record the deeds of heroes.',
    'Your journey is written in the stars.',
    'Every entry in the Lore Codex was written from a brave soul\'s experience.'
  ]
};

const QUESTS = [
  { id: 'quest-seven-stars',  label: 'Collect all Seven Stars',   event: 'star-collected',      threshold: 7 },
  { id: 'quest-combo-tier4',  label: 'Reach Combo Tier 4',        event: 'combo-tier4',          threshold: 1 },
  { id: 'quest-revelation',   label: 'Achieve Divine Revelation',  event: 'revelation-achieved',  threshold: 1 },
];

const STORAGE_KEY = 'nexus_quests_active';
let activeQuests = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let questProgress = {};

function renderQuests() {
  const list    = document.getElementById('npc-quest-list');
  const noLabel = document.getElementById('npc-no-quests');
  if (!list) return;

  if (activeQuests.length === 0) {
    list.innerHTML = '';
    if (noLabel) noLabel.style.display = '';
    return;
  }
  if (noLabel) noLabel.style.display = 'none';
  list.innerHTML = activeQuests.map(qid => {
    const q = QUESTS.find(x => x.id === qid);
    return q ? `<li class="npc-quest-item">${q.label}</li>` : '';
  }).join('');
}

document.querySelectorAll('.npc-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.npc-btn').forEach(b => b.classList.remove('npc-btn--active'));
    btn.classList.add('npc-btn--active');

    const npc   = btn.dataset.npc;
    const lines = NPC_DIALOGUE[npc] || ['…'];
    const box   = document.getElementById('npc-dialogue');
    if (box) box.innerHTML = lines.map(l => `<p>${l}</p>`).join('');

    const status = document.getElementById('npc-status');
    if (status) status.textContent = `Speaking with the ${npc.charAt(0).toUpperCase() + npc.slice(1)}…`;

    // Sage starts the quest
    if (npc === 'sage' && !activeQuests.includes('quest-seven-stars')) {
      activeQuests.push('quest-seven-stars');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeQuests));
      renderQuests();
    }
  });
});

// Wire quest completion events
NexusOS.on('revelation-achieved', () => {
  activeQuests = activeQuests.filter(q => q !== 'quest-revelation');
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activeQuests));
  renderQuests();
});

renderQuests();
