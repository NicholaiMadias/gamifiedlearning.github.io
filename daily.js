import list from './dailyChallenges.json' assert { type: 'json' };

export function getTodayChallenge() {
  const today = new Date().toDateString();
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem('daily') || '{}');
  } catch (e) {
    saved = {};
  }

  if (saved.date === today) return saved;

  const challenge = list[Math.floor(Math.random() * list.length)];

  const newData = { date: today, challenge, progress: {} };
  localStorage.setItem('daily', JSON.stringify(newData));
  return newData;
}

export function updateDailyProgress(key, value) {
  const data = getTodayChallenge();
  data.progress[key] = value;
  localStorage.setItem('daily', JSON.stringify(data));
}

/**
 * Safe evaluator for challenge `check` expressions.
 * Supports simple `field op value` comparisons where field is a known state key.
 * Uses no eval/Function — avoids arbitrary code execution.
 */
function safeCheck(expr, state) {
  const OPS = [
    ['>=', (a, b) => a >= b],
    ['<=', (a, b) => a <= b],
    ['===', (a, b) => a === b],
    ['!==', (a, b) => a !== b],
    ['>', (a, b) => a > b],
    ['<', (a, b) => a < b],
    ['==', (a, b) => a == b],
  ];
  for (const [op, fn] of OPS) {
    const idx = expr.indexOf(op);
    if (idx !== -1) {
      const field = expr.slice(0, idx).trim();
      const valueStr = expr.slice(idx + op.length).trim();
      const value = Number(valueStr);
      if (!Object.prototype.hasOwnProperty.call(state, field) || !Number.isFinite(value)) return false;
      return fn(state[field], value);
    }
  }
  return false;
}

export function checkDailyCompletion(state) {
  const data = getTodayChallenge();
  const expr = data.challenge.check;

  if (safeCheck(expr, state)) {
    localStorage.setItem('dailyComplete', 'true');
    return true;
  }
  return false;
}
