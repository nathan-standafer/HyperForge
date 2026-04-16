const sessions: Record<string, { id: string; template_id: string | null }> = {};
const sessionTargets: { id: string; session_id: string; exercise_id: string; ordinal: number; target_sets: number; target_reps: number; target_weight: number | null }[] = [];
const templateExercises = [
  { id: 'te1', exercise_id: 'ex1', ordinal: 0, target_sets: 3, target_reps: 10, target_weight: 100, exercise_exists: 1 },
  { id: 'te2', exercise_id: 'ex-deleted', ordinal: 1, target_sets: 3, target_reps: 8, target_weight: null, exercise_exists: 0 },
  { id: 'te3', exercise_id: 'ex2', ordinal: 2, target_sets: 4, target_reps: 6, target_weight: 60, exercise_exists: 1 },
];

jest.mock('expo-crypto', () => {
  let c = 0;
  return { randomUUID: () => `st-uuid-${++c}` };
});

jest.mock('../../src/services/session-service', () => ({
  createSession: jest.fn().mockImplementation(async () => {
    const id = 'session-1';
    sessions[id] = { id, template_id: null };
    return { id, startTime: new Date().toISOString(), endTime: null, status: 'active', createdAt: new Date().toISOString() };
  }),
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn(),
    runAsync: jest.fn().mockImplementation(async (sql: string, ...args: unknown[]) => {
      if (sql.includes('UPDATE sessions SET template_id')) {
        const s = sessions[args[1] as string];
        if (s) s.template_id = args[0] as string;
      }
      if (sql.includes('INSERT INTO session_targets')) {
        sessionTargets.push({
          id: args[0] as string, session_id: args[1] as string,
          exercise_id: args[2] as string, ordinal: args[3] as number,
          target_sets: args[4] as number, target_reps: args[5] as number,
          target_weight: args[6] as number | null,
        });
      }
    }),
    getAllAsync: jest.fn().mockImplementation(async (sql: string, ...args: unknown[]) => {
      if (sql.includes('FROM template_exercises')) return templateExercises;
      if (sql.includes('FROM session_targets')) {
        return sessionTargets
          .filter((st) => st.session_id === args[0])
          .sort((a, b) => a.ordinal - b.ordinal);
      }
      return [];
    }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    closeAsync: jest.fn(),
  }),
}));

import { startSessionFromTemplate, getSessionTargets } from '../../src/services/session-template-service';

describe('session-template-service', () => {
  beforeEach(() => {
    Object.keys(sessions).forEach((k) => delete sessions[k]);
    sessionTargets.splice(0, sessionTargets.length);
  });

  it('creates session, sets template_id, inserts targets in order', async () => {
    const { session, targets } = await startSessionFromTemplate('tpl-1');
    expect(session.id).toBe('session-1');
    expect(sessions['session-1'].template_id).toBe('tpl-1');
    expect(targets).toHaveLength(2); // skips deleted exercise
    expect(targets[0].exerciseId).toBe('ex1');
    expect(targets[0].ordinal).toBe(0);
    expect(targets[1].exerciseId).toBe('ex2');
    expect(targets[1].ordinal).toBe(1);
  });

  it('reports warnings for deleted exercises', async () => {
    const { warnings } = await startSessionFromTemplate('tpl-1');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('ex-deleted');
  });

  it('getSessionTargets returns ordered targets', async () => {
    await startSessionFromTemplate('tpl-1');
    const targets = await getSessionTargets('session-1');
    expect(targets).toHaveLength(2);
    expect(targets[0].ordinal).toBe(0);
    expect(targets[1].ordinal).toBe(1);
  });

  it('getSessionTargets returns empty for non-template session', async () => {
    const targets = await getSessionTargets('no-such-session');
    expect(targets).toEqual([]);
  });
});
