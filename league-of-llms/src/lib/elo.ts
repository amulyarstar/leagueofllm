/**
 * Standard ELO rating update, K-factor tuned for a multi-model leaderboard
 * where each battle produces several pairwise outcomes (one per vote category).
 */
const K_FACTOR = 24;

export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

/**
 * Updates two ratings after a single pairwise result.
 * @param score 1 = winner is A, 0 = winner is B, 0.5 = tie
 */
export function updateElo(
  ratingA: number,
  ratingB: number,
  score: 0 | 0.5 | 1
): { ratingA: number; ratingB: number } {
  const expectedA = expectedScore(ratingA, ratingB);
  const expectedB = 1 - expectedA;

  const newRatingA = Math.round(ratingA + K_FACTOR * (score - expectedA));
  const newRatingB = Math.round(ratingB + K_FACTOR * (1 - score - expectedB));

  return { ratingA: newRatingA, ratingB: newRatingB };
}

/**
 * A single vote pits the winning model against every other model shown in the
 * battle (round-robin), so a 4-way battle produces 3 pairwise ELO updates per vote.
 */
export function applyRoundRobinElo(
  ratings: Record<string, number>,
  winner: string
): Record<string, number> {
  const next = { ...ratings };
  for (const other of Object.keys(ratings)) {
    if (other === winner) continue;
    const { ratingA, ratingB } = updateElo(next[winner], next[other], 1);
    next[winner] = ratingA;
    next[other] = ratingB;
  }
  return next;
}
