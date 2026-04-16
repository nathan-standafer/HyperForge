import { getDatabase } from '../db/database';
import { estimateOneRm } from '../lib/one-rm';
import { resolveRange, type TimeRange } from '../lib/time-range';

export interface SessionPoint {
  sessionId: string;
  date: string;
  topWeight: number;
  topWeightReps: number;
  estimatedOneRm: number | null;
  totalVolume: number;
  setCount: number;
}

export interface ExerciseProgressSeries {
  exerciseId: string;
  range: TimeRange;
  points: SessionPoint[];
}

interface SetJoinRow {
  session_id: string;
  start_time: string;
  weight: number;
  reps: number;
}

export async function getExerciseProgress(
  exerciseId: string,
  range: TimeRange,
): Promise<ExerciseProgressSeries> {
  const db = await getDatabase();
  const { start, end } = resolveRange(range);
  const rows = await db.getAllAsync<SetJoinRow>(
    `SELECT s.id AS session_id, s.start_time, st.weight, st.reps
     FROM sessions s
     JOIN sets st ON st.session_id = s.id
     WHERE st.exercise_id = ?
       AND s.start_time >= ?
       AND s.start_time <= ?
     ORDER BY s.start_time ASC`,
    exerciseId,
    start.toISOString(),
    end.toISOString(),
  );

  const bySession = new Map<
    string,
    { date: string; weights: { weight: number; reps: number }[] }
  >();
  for (const row of rows) {
    let bucket = bySession.get(row.session_id);
    if (!bucket) {
      bucket = { date: row.start_time, weights: [] };
      bySession.set(row.session_id, bucket);
    }
    bucket.weights.push({ weight: row.weight, reps: row.reps });
  }

  const points: SessionPoint[] = [];
  for (const [sessionId, bucket] of bySession) {
    let topWeight = -Infinity;
    let topWeightReps = 0;
    let topEpley = 0;
    let totalVolume = 0;
    for (const { weight, reps } of bucket.weights) {
      if (
        weight > topWeight ||
        (weight === topWeight && reps > topWeightReps)
      ) {
        topWeight = weight;
        topWeightReps = reps;
      }
      const epley = estimateOneRm(weight, reps);
      if (epley !== null && epley > topEpley) topEpley = epley;
      totalVolume += weight * reps;
    }
    points.push({
      sessionId,
      date: bucket.date,
      topWeight: topWeight === -Infinity ? 0 : topWeight,
      topWeightReps,
      estimatedOneRm: topEpley > 0 ? topEpley : null,
      totalVolume,
      setCount: bucket.weights.length,
    });
  }

  points.sort((a, b) => a.date.localeCompare(b.date));
  return { exerciseId, range, points };
}
