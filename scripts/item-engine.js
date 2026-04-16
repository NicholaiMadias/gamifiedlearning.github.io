// item-engine.js — Items and boosts

const STORAGE_KEY = 'nexus_inventory';

const ITEM_DEFS = {
  ministry_scroll:   { name: 'Ministry Scroll',    icon: '📜', effect: 'charge_boost',   value: 10 },
  crown_of_life:     { name: 'Crown of Life',       icon: '👑', effect: 'score_multiplier', value: 1.5 },
  hidden_manna:      { name: 'Hidden Manna',        icon: '🍞', effect: 'charge_boost',   value: 20 },
  morning_star:      { name: 'Morning Star',        icon: '🌟', effect: 'fx_boost',       value: 1 },
  white_garment:     { name: 'White Garment',       icon: '🤍', effect: 'unlock_hint',    value: 1 },
  open_door:         { name: 'Open Door',           icon: '🚪', effect: 'module_unlock',  value: 1 },
  throne_seat:       { name: 'Throne Seat',         icon: '🪑', effect: 'mystery_boost',  value: 25 },
  housing_key_tampa: { name: 'Housing Key: Tampa',  icon: '🔑', effect: 'real_world',     value: 1 },
};

function getInventory() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}

function addItem(itemId, quantity = 1) {
  const inv = getInventory();
  inv[itemId] = (inv[itemId] || 0) + quantity;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inv));
  NexusOS.emit('inventory-updated', { itemId, quantity, inventory: inv });
  console.info(`[ItemEngine] +${quantity} ${itemId}`);
}

function useItem(itemId) {
  const inv = getInventory();
  if (!inv[itemId] || inv[itemId] < 1) return false;

  const def = ITEM_DEFS[itemId];
  if (!def) return false;

  inv[itemId]--;
  if (inv[itemId] === 0) delete inv[itemId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inv));

  NexusOS.emit('item-used', { itemId, effect: def.effect, value: def.value });
  return true;
}

NexusOS.on('reward-granted', ({ item }) => {
  if (item) addItem(item);
});
