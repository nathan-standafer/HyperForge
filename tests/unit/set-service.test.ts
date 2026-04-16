/**
 * Unit tests for set-service.
 *
 * These tests require expo-sqlite which is a native module.
 * They serve as integration tests when run on-device via Expo,
 * or can be run with a mock database in CI.
 */

// NOTE: expo-sqlite requires native runtime. These tests are
// structured for on-device execution via Expo's test runner
// or with a jest mock of expo-sqlite.

jest.mock('expo-sqlite', () => {
  const rows: Record<string, unknown[]> = { sets: [] };
  return {
    openDatabaseAsync: jest.fn().mockResolvedValue({
      execAsync: jest.fn(),
      runAsync: jest.fn().mockImplementation(async (sql: string, ...args: unknown[]) => {
        if (sql.includes('INSERT INTO sets')) {
          rows.sets.push({
            id: args[0],
            session_id: args[1],
            exercise_id: args[2],
            set_number: args[3],
            weight: args[4],
            reps: args[5],
            rir: args[6],
            timestamp: args[7],
            created_at: args[8],
            updated_at: args[9],
          });
        }
      }),
      getAllAsync: jest.fn().mockResolvedValue([]),
      getFirstAsync: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('COUNT')) return { c: rows.sets.length };
        if (sql.includes('SELECT * FROM sets WHERE id')) return rows.sets[rows.sets.length - 1] ?? null;
        return null;
      }),
      closeAsync: jest.fn(),
    }),
  };
});

jest.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).slice(2, 8),
}));

import { logSet } from '../../src/services/set-service';

describe('set-service', () => {
  describe('logSet', () => {
    it('rejects negative weight', async () => {
      await expect(
        logSet({
          sessionId: 's1',
          exerciseId: 'e1',
          weight: -5,
          reps: 10,
        }),
      ).rejects.toThrow('Weight must be >= 0');
    });

    it('rejects zero reps', async () => {
      await expect(
        logSet({
          sessionId: 's1',
          exerciseId: 'e1',
          weight: 80,
          reps: 0,
        }),
      ).rejects.toThrow('Reps must be >= 1');
    });

    it('rejects RIR out of range', async () => {
      await expect(
        logSet({
          sessionId: 's1',
          exerciseId: 'e1',
          weight: 80,
          reps: 10,
          rir: 11,
        }),
      ).rejects.toThrow('RIR must be 0-10');
    });

    it('accepts zero weight for bodyweight exercises', async () => {
      const set = await logSet({
        sessionId: 's1',
        exerciseId: 'e1',
        weight: 0,
        reps: 15,
      });
      expect(set.weight).toBe(0);
      expect(set.reps).toBe(15);
    });

    it('auto-assigns set number starting at 1', async () => {
      const set = await logSet({
        sessionId: 's1',
        exerciseId: 'e1',
        weight: 80,
        reps: 10,
      });
      expect(set.setNumber).toBeGreaterThanOrEqual(1);
    });
  });
});
