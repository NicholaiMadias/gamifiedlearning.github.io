/**
 * levelSystem.js — level configuration and level-up logic.
 * Level data is inlined to avoid JSON import-assertion browser compatibility issues.
 * Each entry mirrors public/levels.json: level, target, moves (move limit), reward, difficultyModifier.
 */

const levels = [
  { "level": 1, "target": 200,  "moves": 20, "reward": 50,  "difficultyModifier": 1.0 },
  { "level": 2, "target": 400,  "moves": 22, "reward": 100, "difficultyModifier": 1.2 },
  { "level": 3, "target": 700,  "moves": 24, "reward": 150, "difficultyModifier": 1.5 },
  { "level": 4, "target": 1100, "moves": 26, "reward": 200, "difficultyModifier": 2.0 },
  { "level": 5, "target": 1600, "moves": 28, "reward": 300, "difficultyModifier": 2.5 }
];

export const MAX_LEVEL = levels.length;

export function getLevelConfig(level) {
  if (level < 1) return levels[0];
  return levels.find(l => l.level === level) || levels[levels.length - 1];
}

export function checkLevelUp(score, level) {
  const cfg = getLevelConfig(level);
  return score >= cfg.target;
}
