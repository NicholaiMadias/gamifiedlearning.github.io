import list from './dailyChallenges.json' assert { type: 'json' };

export function getTodayChallenge() {
  const today = new Date().toDateString();
  const saved = JSON.parse(localStorage.getItem('daily') || '{}');

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

export function checkDailyCompletion(state) {
  const data = getTodayChallenge();
  const expr = data.challenge.check;

  const fn = new Function('state', `return ${expr}`);
  if (fn(state)) {
    localStorage.setItem('dailyComplete', 'true');
    return true;
  }
  return false;
}
