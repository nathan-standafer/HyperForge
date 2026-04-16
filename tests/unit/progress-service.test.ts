interface SetRow {
  session_id: string;
  exercise_id: string;
  weight: number;
  reps: number;
  timestamp: string;
}
interface SessionRow {
  id: string;
  start_time: string;
}

const sessions: SessionRow[] = [];
const sets: SetRow[] = [];

jest.mock('expo-crypto', () => ({ randomUUID: () => 'test-uuid' }));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getAllAsync: jest.fn().mockImplementation(
      async (sql: string, exerciseId: string, startIso: string, endIso: string) => {
        if (!sql.includes('JOIN sets')) return [];
        return sets
          .filter((s) => s.exercise_id === exerciseId)
          .map((s) => {
            const session = sessions.find((x) => x.id === s.session_id);
            return session
              ? {
                  session_id: s.session_id,
                  start_time: session.start_time,
                  weight: s.weight,
                  reps: s.reps,
                }
              : null;
          })
          .filter((r): r is NonNullable<typeof r> => r !== null)
          .filter((r) => r.start_time >= startIso && r.start_time <= endIso);
      },
    ),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    closeAsync: jest.fn(),
  }),
}));

import { getExerciseProgress } from '../../src/services/progress-service';

function seed(newSessions: SessionRow[], newSets: SetRow[]) {
  sessions.splice(0, sessions.length, ...newSessions);
  sets.splice(0, sets.length, ...newSets);
}

describe('getExerciseProgress', () => {
  beforeEach(() => seed([], []));

  it('returns empty series for no data', async () => {
    const result = await getExerciseProgress('ex1', 'all');
    expect(result).toEqual({ exerciseId: 'ex1', range: 'all', points: [] });
  });

  it('aggregates per session with top weight, 1RM, and volume', async () => {
    seed(
      [
        { id: 'sess1', start_time: '2026-01-01T10:00:00.000Z' },
        { id: 'sess2', start_time: '2026-02-01T10:00:00.000Z' },
      ],
      [
        { session_id: 'sess1', exercise_id: 'ex1', weight: 100, reps: 5, timestamp: '2026-01-01T10:00:00Z' },
        { session_id: 'sess1', exercise_id: 'ex1', weight: 100, reps: 3, timestamp: '2026-01-01T10:05:00Z' },
        { session_id: 'sess2', exercise_id: 'ex1', weight: 110, reps: 5, timestamp: '2026-02-01T10:00:00Z' },
      ],
    );
    const { points } = await getExerciseProgress('ex1', 'all');
    expect(points).toHaveLength(2);
    expect(points[0].sessionId).toBe('sess1');
    expect(points[0].topWeight).toBe(100);
    expect(points[0].topWeightReps).toBe(5); // tie on weight → higher reps wins
    expect(points[0].setCount).toBe(2);
    expect(points[0].totalVolume).toBe(100 * 5 + 100 * 3);
    expect(points[0].estimatedOneRm).toBeCloseTo(116.67, 2);
    expect(points[1].topWeight).toBe(110);
  });

  it('returns chronologically ascending points', async () => {
    seed(
      [
        { id: 's2', start_time: '2026-03-01T10:00:00.000Z' },
        { id: 's1', start_time: '2026-01-01T10:00:00.000Z' },
      ],
      [
        { session_id: 's2', exercise_id: 'ex1', weight: 100, reps: 5, timestamp: '2026-03-01T10:00:00Z' },
        { session_id: 's1', exercise_id: 'ex1', weight: 90, reps: 5, timestamp: '2026-01-01T10:00:00Z' },
      ],
    );
    const { points } = await getExerciseProgress('ex1', 'all');
    expect(points.map((p) => p.sessionId)).toEqual(['s1', 's2']);
  });

  it('handles single data point', async () => {
    seed(
      [{ id: 's1', start_time: '2026-01-01T10:00:00.000Z' }],
      [{ session_id: 's1', exercise_id: 'ex1', weight: 80, reps: 8, timestamp: '2026-01-01T10:00:00Z' }],
    );
    const { points } = await getExerciseProgress('ex1', 'all');
    expect(points).toHaveLength(1);
    expect(points[0].topWeight).toBe(80);
  });

  it('returns null estimatedOneRm for bodyweight-only session', async () => {
    seed(
      [{ id: 's1', start_time: '2026-01-01T10:00:00.000Z' }],
      [{ session_id: 's1', exercise_id: 'ex1', weight: 0, reps: 10, timestamp: '2026-01-01T10:00:00Z' }],
    );
    const { points } = await getExerciseProgress('ex1', 'all');
    expect(points).toHaveLength(1);
    expect(points[0].estimatedOneRm).toBeNull();
    expect(points[0].totalVolume).toBe(0);
  });

  it('filters by time range', async () => {
    const old = new Date();
    old.setFullYear(old.getFullYear() - 3);
    const recent = new Date();
    recent.setDate(recent.getDate() - 2);
    seed(
      [
        { id: 'old', start_time: old.toISOString() },
        { id: 'recent', start_time: recent.toISOString() },
      ],
      [
        { session_id: 'old', exercise_id: 'ex1', weight: 50, reps: 5, timestamp: old.toISOString() },
        { session_id: 'recent', exercise_id: 'ex1', weight: 100, reps: 5, timestamp: recent.toISOString() },
      ],
    );
    const { points } = await getExerciseProgress('ex1', '4w');
    expect(points).toHaveLength(1);
    expect(points[0].sessionId).toBe('recent');
  });
});
