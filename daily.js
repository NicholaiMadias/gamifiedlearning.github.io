/**
 * daily.js — daily challenge tracking.
 * Challenge data is inlined to avoid JSON import-assertion browser compatibility issues.
 */

const list = [
  { "id": "score500", "desc": "Score 500 points today",  "check": (s, l, c) => s >= 500 },
  { "id": "clear20",  "desc": "Clear 20 gems today",     "check": (s, l, c) => c >= 20  },
  { "id": "reach3",   "desc": "Reach level 3 today",     "check": (s, l, c) => l >= 3   }
];

export function getTodayChallenge() {
  const today = new Date().toDateString();
  const saved = JSON.parse(localStorage.getItem('daily') || '{}');

  if (saved.date === today) return saved;

  // Pick by index only — strip the non-serialisable check function before storing
  const idx = Math.floor(Math.random() * list.length);
  const { id, desc } = list[idx];
  const newData = { date: today, challenge: { id, desc }, progress: {} };
  localStorage.setItem('daily', JSON.stringify(newData));
  return newData;
}

export function updateDailyProgress(key, value) {
  const data = getTodayChallenge();
  data.progress[key] = value;
  localStorage.setItem('daily', JSON.stringify(data));
}

export function checkDailyCompletion(state) {
  const data = getTodayChallenge();
  const id = data.challenge?.id;
  if (!id) return false;

  const { score, level, clears } = state;

  // Safe predefined checks — no eval/new Function needed
  const checks = {
    score500: (s, l, c) => s >= 500,
    clear20:  (s, l, c) => c >= 20,
    reach3:   (s, l, c) => l >= 3,
  };

  const fn = checks[id];
  if (fn && fn(score, level, clears)) {
    localStorage.setItem('dailyComplete', 'true');
    return true;
  }
  return false;
}

