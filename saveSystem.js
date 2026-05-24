const STORAGE_KEY = 'matchmaker-saves';

function safeSlot(slot) {
  return slot || 'slot1';
}

function getStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('Save load failed:', e);
    return {};
  }
}

export function saveGame(slot, data) {
  const key = safeSlot(slot);
  const store = getStore();
  store[key] = data;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('Save write failed:', e);
  }
}

export function loadGame(slot) {
  const key = safeSlot(slot);
  const store = getStore();
  return store[key] || null;
}
