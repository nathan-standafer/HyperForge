interface SetDoc {
  set_id: string;
  exercise_id: string;
  exercise_name: string;
  session_id: string;
  start_time: string;
  weight: number;
  reps: number;
}

const allSets: SetDoc[] = [];

jest.mock('expo-crypto', () => ({ randomUUID: () => 'uuid' }));
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getAllAsync: jest.fn().mockImplementation(async (sql: string, ...args: unknown[]) => {
      if (sql.includes('FROM sets st') && sql.includes('WHERE st.exercise_id')) {
        return allSets.filter((s) => s.exercise_id === args[0]);
      }
      if (sql.includes('FROM sets st')) {
        return [...allSets];
      }
      return [];
    }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    closeAsync: jest.fn(),
  }),
}));

import { getExercisePrs, getRecentPrs } from '../../src/services/pr-service';

function seed(sets: SetDoc[]) {
  allSets.splice(0, allSets.length, ...sets);
}

function set(partial: Partial<SetDoc>): SetDoc {
  return {
    set_id: 'set-' + Math.random().toString(36).slice(2, 8),
    exercise_id: 'ex1',
    exercise_name: 'Bench Press',
    session_id: 'sess-' + Math.random().toString(36).slice(2, 8),
    start_time: '2026-01-01T00:00:00.000Z',
    weight: 100,
    reps: 5,
    ...partial,
  };
}

describe('getExercisePrs', () => {
  beforeEach(() => seed([]));

  it('returns empty array when no sets', async () => {
    expect(await getExercisePrs('ex1')).toEqual([]);
  });

  it('computes best weight per rep bucket (1/3/5/8/10+)', async () => {
    seed([
      set({ weight: 100, reps: 1, start_time: '2026-01-01' }),
      set({ weight: 120, reps: 1, start_time: '2026-02-01' }),
      set({ weight: 90, reps: 5, start_time: '2026-01-10' }),
      set({ weight: 95, reps: 5, start_time: '2026-02-10' }),
      set({ weight: 60, reps: 12, start_time: '2026-03-01' }),
      set({ weight: 65, reps: 15, start_time: '2026-03-05' }),
    ]);
    const prs = await getExercisePrs('ex1');
    const byBucket = new Map(prs.map((p) => [p.repRange, p]));
    expect(byBucket.get(1)?.weight).toBe(120);
    expect(byBucket.get(5)?.weight).toBe(95);
    expect(byBucket.get(10)?.weight).toBe(65);
    expect(byBucket.has(3)).toBe(false);
    expect(byBucket.has(8)).toBe(false);
  });

  it('includes all-time "1rm" Epley bucket', async () => {
    seed([
      set({ weight: 100, reps: 5, start_time: '2026-01-01' }), // epley ~116.67
      set({ weight: 110, reps: 3, start_time: '2026-02-01' }), // epley 121
    ]);
    const prs = await getExercisePrs('ex1');
    const oneRm = prs.find((p) => p.repRange === '1rm');
    expect(oneRm).toBeDefined();
    expect(oneRm?.weight).toBe(110);
    expect(oneRm?.reps).toBe(3);
  });

  it('excludes bodyweight sets from weight PRs', async () => {
    seed([
      set({ weight: 0, reps: 10, start_time: '2026-01-01' }),
      set({ weight: 0, reps: 12, start_time: '2026-02-01' }),
    ]);
    const prs = await getExercisePrs('ex1');
    expect(prs).toEqual([]);
  });

  it('keeps earliest occurrence on ties', async () => {
    seed([
      set({ set_id: 'a', weight: 100, reps: 1, start_time: '2026-01-01' }),
      set({ set_id: 'b', weight: 100, reps: 1, start_time: '2026-02-01' }),
    ]);
    const prs = await getExercisePrs('ex1');
    expect(prs.find((p) => p.repRange === 1)?.setId).toBe('a');
  });
});

describe('getRecentPrs', () => {
  beforeEach(() => seed([]));

  it('returns empty for no data', async () => {
    expect(await getRecentPrs('all')).toEqual([]);
  });

  it('only returns PRs whose achievement falls in range, newest first', async () => {
    const old = new Date();
    old.setFullYear(old.getFullYear() - 2);
    const recent = new Date();
    recent.setDate(recent.getDate() - 3);
    seed([
      set({ set_id: 'old1', weight: 100, reps: 1, start_time: old.toISOString() }),
      set({ set_id: 'new1', weight: 120, reps: 1, start_time: recent.toISOString() }),
    ]);
    const prs = await getRecentPrs('4w');
    expect(prs.length).toBeGreaterThan(0);
    for (const pr of prs) {
      expect(new Date(pr.achievedOn).getTime()).toBeGreaterThan(
        Date.now() - 29 * 24 * 3600 * 1000,
      );
    }
    for (let i = 1; i < prs.length; i++) {
      expect(prs[i - 1].achievedOn >= prs[i].achievedOn).toBe(true);
    }
  });
});
