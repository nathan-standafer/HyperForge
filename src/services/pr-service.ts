import { getDatabase } from '../db/database';
import { estimateOneRm } from '../lib/one-rm';
import { resolveRange, type TimeRange } from '../lib/time-range';

export type PrRepRange = 1 | 3 | 5 | 8 | 10 | '1rm';

export interface PersonalRecord {
  exerciseId: string;
  exerciseName?: string;
  repRange: PrRepRange;
  weight: number;
  reps: number;
  achievedOn: string;
  sessionId: string;
  setId: string;
}

interface SetJoinRow {
  set_id: string;
  exercise_id: string;
  exercise_name: string;
  session_id: string;
  start_time: string;
  weight: number;
  reps: number;
}

const WEIGHT_BUCKETS: Exclude<PrRepRange, '1rm'>[] = [1, 3, 5, 8, 10];

function bucketForReps(reps: number): Exclude<PrRepRange, '1rm'> | null {
  if (reps === 1) return 1;
  if (reps === 3) return 3;
  if (reps === 5) return 5;
  if (reps === 8) return 8;
  if (reps >= 10) return 10;
  return null;
}

function computePrsFromRows(rows: SetJoinRow[]): PersonalRecord[] {
  const byExercise = new Map<string, SetJoinRow[]>();
  for (const row of rows) {
    const bucket = byExercise.get(row.exercise_id) ?? [];
    bucket.push(row);
    byExercise.set(row.exercise_id, bucket);
  }

  const prs: PersonalRecord[] = [];
  for (const [exerciseId, sets] of byExercise) {
    const bestByBucket = new Map<Exclude<PrRepRange, '1rm'>, SetJoinRow>();
    let bestEpley: { row: SetJoinRow; value: number } | null = null;

    const ordered = [...sets].sort((a, b) =>
      a.start_time.localeCompare(b.start_time),
    );

    for (const row of ordered) {
      if (row.weight <= 0) continue;
      const bucket = bucketForReps(row.reps);
      if (bucket !== null) {
        const current = bestByBucket.get(bucket);
        if (!current || row.weight > current.weight) {
          bestByBucket.set(bucket, row);
        }
      }
      const epley = estimateOneRm(row.weight, row.reps);
      if (epley !== null && (!bestEpley || epley > bestEpley.value)) {
        bestEpley = { row, value: epley };
      }
    }

    const exerciseName = ordered[0]?.exercise_name;
    for (const bucket of WEIGHT_BUCKETS) {
      const row = bestByBucket.get(bucket);
      if (row) {
        prs.push({
          exerciseId,
          exerciseName,
          repRange: bucket,
          weight: row.weight,
          reps: row.reps,
          achievedOn: row.start_time,
          sessionId: row.session_id,
          setId: row.set_id,
        });
      }
    }
    if (bestEpley) {
      prs.push({
        exerciseId,
        exerciseName,
        repRange: '1rm',
        weight: bestEpley.row.weight,
        reps: bestEpley.row.reps,
        achievedOn: bestEpley.row.start_time,
        sessionId: bestEpley.row.session_id,
        setId: bestEpley.row.set_id,
      });
    }
  }

  return prs;
}

async function queryExerciseSets(
  exerciseId?: string,
): Promise<SetJoinRow[]> {
  const db = await getDatabase();
  if (exerciseId) {
    return db.getAllAsync<SetJoinRow>(
      `SELECT st.id AS set_id, st.exercise_id, e.name AS exercise_name,
              st.session_id, s.start_time, st.weight, st.reps
       FROM sets st
       JOIN sessions s ON s.id = st.session_id
       JOIN exercises e ON e.id = st.exercise_id
       WHERE st.exercise_id = ?
       ORDER BY s.start_time ASC`,
      exerciseId,
    );
  }
  return db.getAllAsync<SetJoinRow>(
    `SELECT st.id AS set_id, st.exercise_id, e.name AS exercise_name,
            st.session_id, s.start_time, st.weight, st.reps
     FROM sets st
     JOIN sessions s ON s.id = st.session_id
     JOIN exercises e ON e.id = st.exercise_id
     ORDER BY s.start_time ASC`,
  );
}

export async function getExercisePrs(
  exerciseId: string,
): Promise<PersonalRecord[]> {
  const rows = await queryExerciseSets(exerciseId);
  return computePrsFromRows(rows);
}

export async function getRecentPrs(
  range: TimeRange,
): Promise<PersonalRecord[]> {
  const { start, end } = resolveRange(range);
  const rows = await queryExerciseSets();
  const allPrs = computePrsFromRows(rows);
  return allPrs
    .filter(
      (pr) => pr.achievedOn >= start.toISOString() && pr.achievedOn <= end.toISOString(),
    )
    .sort((a, b) => b.achievedOn.localeCompare(a.achievedOn));
}
