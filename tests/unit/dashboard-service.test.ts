interface SessionRow {
  id: string;
  start_time: string;
  end_time: string | null;
  status: string;
}
interface SetRow {
  session_id: string;
  weight: number;
  reps: number;
}

const sessions: SessionRow[] = [];
const sets: SetRow[] = [];

jest.mock('expo-crypto', () => ({ randomUUID: () => 'uuid' }));
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getAllAsync: jest.fn().mockImplementation(async (sql: string, ...args: unknown[]) => {
      if (sql.includes('FROM sessions') && sql.includes('start_time >=')) {
        const [startIso, endIso] = args as [string, string];
        return sessions.filter(
          (s) =>
            s.status === 'complete' &&
            s.start_time >= startIso &&
            s.start_time <= endIso,
        );
      }
      if (sql.includes('FROM sessions WHERE status')) {
        return sessions.filter((s) => s.status === 'complete').map((s) => ({ start_time: s.start_time }));
      }
      if (sql.includes('FROM sets st') && sql.includes('JOIN sessions') && sql.includes('start_time >=')) {
        const [startIso, endIso] = args as [string, string];
        const sessionIds = new Set(
          sessions
            .filter((s) => s.status === 'complete' && s.start_time >= startIso && s.start_time <= endIso)
            .map((s) => s.id),
        );
        return sets
          .filter((st) => sessionIds.has(st.session_id))
          .map((st) => ({ weight: st.weight, reps: st.reps }));
      }
      // PR query used by getRecentPrs
      return [];
    }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    closeAsync: jest.fn(),
  }),
}));

import { getDashboardSummary } from '../../src/services/dashboard-service';

function seed(newSessions: SessionRow[], newSets: SetRow[]) {
  sessions.splice(0, sessions.length, ...newSessions);
  sets.splice(0, sets.length, ...newSets);
}

describe('getDashboardSummary', () => {
  beforeEach(() => seed([], []));

  it('returns zeros when no data', async () => {
    const s = await getDashboardSummary('4w');
    expect(s.workoutCount).toBe(0);
    expect(s.totalVolume).toBe(0);
    expect(s.workoutsPerWeek).toBe(0);
    expect(s.currentStreakWeeks).toBe(0);
    expect(s.recentPRs).toEqual([]);
  });

  it('counts complete sessions and sums volume in range', async () => {
    const now = new Date();
    const d = (offsetDays: number) => {
      const x = new Date(now);
      x.setDate(x.getDate() - offsetDays);
      return x.toISOString();
    };
    seed(
      [
        { id: 's1', start_time: d(2), end_time: d(2), status: 'complete' },
        { id: 's2', start_time: d(5), end_time: d(5), status: 'complete' },
        { id: 's3', start_time: d(10), end_time: d(10), status: 'active' }, // excluded
      ],
      [
        { session_id: 's1', weight: 100, reps: 5 }, // 500
        { session_id: 's2', weight: 80, reps: 10 }, // 800
        { session_id: 's3', weight: 999, reps: 5 }, // excluded
      ],
    );
    const summary = await getDashboardSummary('4w');
    expect(summary.workoutCount).toBe(2);
    expect(summary.totalVolume).toBe(500 + 800);
    expect(summary.workoutsPerWeek).toBeGreaterThan(0);
  });

  it('streak counts consecutive ISO weeks back from current week', async () => {
    const thisWeek = new Date();
    const lastWeek = new Date(thisWeek);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const twoWeeksAgo = new Date(thisWeek);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const threeWeeksAgo = new Date(thisWeek);
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
    seed(
      [
        { id: 'a', start_time: thisWeek.toISOString(), end_time: thisWeek.toISOString(), status: 'complete' },
        { id: 'b', start_time: lastWeek.toISOString(), end_time: lastWeek.toISOString(), status: 'complete' },
        // gap at twoWeeksAgo
        { id: 'c', start_time: threeWeeksAgo.toISOString(), end_time: threeWeeksAgo.toISOString(), status: 'complete' },
      ],
      [],
    );
    const summary = await getDashboardSummary('all');
    expect(summary.currentStreakWeeks).toBe(2);
  });
});
