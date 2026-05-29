export function checkStarAchievements({ star, score, matrix, unlock }) {
  if (typeof unlock !== "function" || !star || !star.id) return;

  const safeScore = typeof score === "number" && Number.isFinite(score) ? score : 0;
  const targetScore = star?.trial?.targetScore;
  const safeTarget = typeof targetScore === "number" && Number.isFinite(targetScore) ? targetScore : null;

  // Core badge: trial complete
  unlock(`badge_${star.id}_core`);

  // Virtue badge: Matrix threshold
  const virtue = star?.virtue;
  const axis = star?.axis;
  const matrixValue = matrix?.[virtue]?.[axis];
  const safeMatrixValue =
    typeof matrixValue === "number" && Number.isFinite(matrixValue) ? matrixValue : 0;
  if (safeMatrixValue >= 3) {
    unlock(`badge_${star.id}_virtue`);
  }

  // Mastery badge: high score
  if (safeTarget !== null && safeScore >= safeTarget * 1.2) {
    unlock(`badge_${star.id}_mastery`);
  }
}
