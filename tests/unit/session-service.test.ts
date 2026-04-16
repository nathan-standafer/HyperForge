jest.mock('expo-sqlite', () => {
  let activeSession: unknown = null;
  return {
    openDatabaseAsync: jest.fn().mockResolvedValue({
      execAsync: jest.fn(),
      runAsync: jest.fn().mockImplementation(async (sql: string, ...args: unknown[]) => {
        if (sql.includes('INSERT INTO sessions')) {
          activeSession = {
            id: args[0],
            start_time: args[1],
            end_time: null,
            status: 'active',
            created_at: args[2],
          };
        }
        if (sql.includes('UPDATE sessions')) {
          if (activeSession) {
            (activeSession as Record<string, unknown>).end_time = args[0];
            (activeSession as Record<string, unknown>).status = 'complete';
          }
        }
      }),
      getAllAsync: jest.fn().mockResolvedValue([]),
      getFirstAsync: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('COUNT')) return { c: 0 };
        if (sql.includes("status = 'active'")) return activeSession;
        if (sql.includes('WHERE id')) return activeSession;
        return null;
      }),
      closeAsync: jest.fn(),
    }),
  };
});

jest.mock('uuid', () => ({
  v4: () => 'test-session-' + Math.random().toString(36).slice(2, 8),
}));

import {
  createSession,
  getActiveSession,
  endSession,
} from '../../src/services/session-service';

describe('session-service', () => {
  describe('createSession', () => {
    it('creates a new active session', async () => {
      const session = await createSession();
      expect(session.status).toBe('active');
      expect(session.endTime).toBeNull();
      expect(session.startTime).toBeDefined();
    });
  });

  describe('getActiveSession', () => {
    it('returns the active session after creation', async () => {
      const session = await getActiveSession();
      expect(session).not.toBeNull();
      expect(session?.status).toBe('active');
    });
  });

  describe('endSession', () => {
    it('marks session as complete with endTime', async () => {
      const active = await getActiveSession();
      if (!active) throw new Error('No active session');
      const ended = await endSession(active.id);
      expect(ended.status).toBe('complete');
      expect(ended.endTime).not.toBeNull();
    });
  });
});
