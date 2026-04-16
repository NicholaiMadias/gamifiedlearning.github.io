console.log('[NexusOS] badges module loaded');

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'modules/badges.css';
document.head.appendChild(link);

const STORAGE_KEY = 'nexus_badges_unlocked';
let unlocked = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

const BADGE_DEFS = [
  { id: 'spark_initiate',        icon: '✨', title: 'Spark Initiate',        desc: 'First match made in the Arcade.' },
  { id: 'shooting_star_adept',   icon: '🌟', title: 'Shooting Star Adept',   desc: 'Collected 3 of the Seven Stars.' },
  { id: 'ruby_catalyst_master',  icon: '🔴', title: 'Ruby Catalyst Master',  desc: 'Reached Combo Tier 3 in the Arcade.' },
  { id: 'supernova_ascendant',   icon: '💥', title: 'Supernova Ascendant',   desc: 'Achieved Combo Tier 4.' },
  { id: 'revelation_bearer',     icon: '🔮', title: 'Revelation Bearer',     desc: 'Fully charged the Divine Revelation Engine.' },
  { id: 'codex_scholar',         icon: '📖', title: 'Codex Scholar',         desc: 'Unlocked 5 Lore Codex entries.' },
  { id: 'mystery_master',        icon: '🌀', title: 'Mystery Master',         desc: 'Filled the Mystery Meter to 100%.' },
];

function renderBadges() {
  const grid = document.getElementById('badge-grid');
  if (!grid) return;
  grid.innerHTML = BADGE_DEFS.map(b => `
    <div class="badge-card ${unlocked.includes(b.id) ? 'unlocked' : ''}" role="listitem" aria-label="${b.title}${unlocked.includes(b.id) ? ' (unlocked)' : ' (locked)'}">
      <span class="badge-icon">${b.icon}</span>
      <h3>${b.title}</h3>
      <p class="badge-desc">${b.desc}</p>
    </div>
  `).join('');
}

NexusOS.on('badge-earned', ({ badgeId }) => {
  if (!unlocked.includes(badgeId)) {
    unlocked.push(badgeId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
    renderBadges();
    NexusOS.emit('mystery-meter-add', { amount: 15 });
  }
});

// Auto-grant badges based on existing progress
function checkAutoGrants() {
  const stars = JSON.parse(localStorage.getItem('nexus_seven_stars') || '[]');
  if (stars.length >= 1 && !unlocked.includes('spark_initiate')) {
    NexusOS.emit('badge-earned', { badgeId: 'spark_initiate' });
  }
  if (stars.length >= 3 && !unlocked.includes('shooting_star_adept')) {
    NexusOS.emit('badge-earned', { badgeId: 'shooting_star_adept' });
  }
}

checkAutoGrants();
renderBadges();
