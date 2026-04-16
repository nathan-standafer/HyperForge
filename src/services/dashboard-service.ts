import { getDatabase } from '../db/database';
import { resolveRange, isoWeekOf, type TimeRange } from '../lib/time-range';
import { getRecentPrs, type PersonalRecord } from './pr-service';

export interface DashboardSummary {
  range: TimeRange;
  workoutCount: number;
  totalVolume: number;
  workoutsPerWeek: number;
  currentStreakWeeks: number;
  recentPRs: PersonalRecord[];
}

interface SessionRow {
  id: string;
  start_time: string;
  end_time: string | null;
  status: string;
}

interface SetVolumeRow {
  weight: number;
  reps: number;
}

export async function getDashboardSummary(
  range: TimeRange,
): Promise<DashboardSummary> {
  const db = await getDatabase();
  const { start, end } = resolveRange(range);

  const sessions = await db.getAllAsync<SessionRow>(
    `SELECT id, start_time, end_time, status FROM sessions
     WHERE status = 'complete'
       AND start_time >= ?
       AND start_time <= ?
     ORDER BY start_time ASC`,
    start.toISOString(),
    end.toISOString(),
  );

  const workoutCount = sessions.length;

  const volumeRows = workoutCount === 0
    ? []
    : await db.getAllAsync<SetVolumeRow>(
        `SELECT st.weight, st.reps FROM sets st
         JOIN sessions s ON s.id = st.session_id
         WHERE s.status = 'complete'
           AND s.start_time >= ?
           AND s.start_time <= ?`,
        start.toISOString(),
        end.toISOString(),
      );
  const totalVolume = volumeRows.reduce(
    (sum, r) => sum + r.weight * r.reps,
    0,
  );

  const rangeMs = end.getTime() - start.getTime();
  const weeks = Math.max(rangeMs / (7 * 24 * 60 * 60 * 1000), 1);
  const workoutsPerWeek =
    workoutCount === 0 ? 0 : Math.round((workoutCount / weeks) * 10) / 10;

  const currentStreakWeeks = await computeStreak(db);
  const recentPRs = await getRecentPrs(range);

  return {
    range,
    workoutCount,
    totalVolume,
    workoutsPerWeek,
    currentStreakWeeks,
    recentPRs,
  };
}

async function computeStreak(
  db: Awaited<ReturnType<typeof getDatabase>>,
): Promise<number> {
  const allSessions = await db.getAllAsync<{ start_time: string }>(
    `SELECT start_time FROM sessions WHERE status = 'complete'`,
  );
  if (allSessions.length === 0) return 0;

  const weekStarts = new Set<number>();
  for (const s of allSessions) {
    const { start } = isoWeekOf(new Date(s.start_time));
    weekStarts.add(start.getTime());
  }

  let streak = 0;
  const now = new Date();
  const cursor = isoWeekOf(now).start;
  while (weekStarts.has(cursor.getTime())) {
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}
