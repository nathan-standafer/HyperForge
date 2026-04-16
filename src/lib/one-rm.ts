/** Epley 1RM estimate. Returns null for weight <= 0 or reps < 1. */
export function estimateOneRm(weight: number, reps: number): number | null {
  if (weight <= 0) return null;
  if (reps < 1) return null;
  const raw = weight * (1 + reps / 30);
  return Math.round(raw * 100) / 100;
}
