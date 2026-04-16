// unlock-engine.js — Node unlock logic driven by OS events

function unlockNode(node) {
  const storageKey = 'nexus_unlocked_nodes';
  const unlocked = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (!unlocked.includes(node)) {
    unlocked.push(node);
    localStorage.setItem(storageKey, JSON.stringify(unlocked));
  }
  NexusOS.emit('unlock', { node });
  console.info(`[NexusOS] Node unlocked: ${node}`);
}

function isUnlocked(node) {
  const storageKey = 'nexus_unlocked_nodes';
  const unlocked = JSON.parse(localStorage.getItem(storageKey) || '[]');
  return unlocked.includes(node);
}

// Seven Stars → unlocks Arcade
NexusOS.on('star-collected', () => {
  const stars = JSON.parse(localStorage.getItem('nexus_seven_stars') || '[]');
  if (stars.length >= 7) {
    unlockNode('arcade');
  }
});

// Badge earned → unlocks Lore Codex
NexusOS.on('badge-earned', ({ badgeId }) => {
  if (badgeId === 'ruby_catalyst_master') {
    unlockNode('lore-codex');
  }
});

// Revelation achieved → unlocks Lore Codex
NexusOS.on('revelation-achieved', () => {
  unlockNode('lore-codex');
});

// Combo Tier 4 → unlocks Mystery Meter
NexusOS.on('combo-tier4', () => {
  unlockNode('mystery-meter');
});

// Mystery Meter full → unlocks NPC Village
NexusOS.on('mystery-meter-full', () => {
  unlockNode('npc-village');
});
