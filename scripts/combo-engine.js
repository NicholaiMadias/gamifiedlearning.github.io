// combo-engine.js — Combo tracking and tier progression

const COMBO_TIERS = [
  { tier: 1, threshold: 1,  label: 'Spark',      color: '#aaa' },
  { tier: 2, threshold: 3,  label: 'Flame',       color: '#ff9800' },
  { tier: 3, threshold: 5,  label: 'Inferno',     color: '#f44336' },
  { tier: 4, threshold: 8,  label: 'Supernova',   color: '#e040fb' },
];

let comboCount = 0;
let currentTier = 1;

function getComboTier(count) {
  let tier = COMBO_TIERS[0];
  for (const t of COMBO_TIERS) {
    if (count >= t.threshold) tier = t;
  }
  return tier;
}

function handleCombo(count) {
  comboCount = count;
  const tier = getComboTier(count);

  if (tier.tier !== currentTier) {
    currentTier = tier.tier;
    NexusOS.emit(`combo-tier${tier.tier}`, { combo: count, tier: tier.tier });
    console.info(`[ComboEngine] Tier ${tier.tier} — ${tier.label}`);
  }
}

NexusOS.on('arcade-combo', ({ combo, tier }) => {
  handleCombo(combo);
});

function resetCombo() {
  comboCount = 0;
  currentTier = 1;
}
