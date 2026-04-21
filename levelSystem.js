import levels from './levels.json' assert { type: 'json' };

export function getLevelConfig(level) {
  return levels.find(l => l.level === level) || levels[levels.length - 1];
}

export function checkLevelUp(score, level) {
  const cfg = getLevelConfig(level);
  return score >= cfg.target;
}
