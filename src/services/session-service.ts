import { randomUUID } from 'expo-crypto';
import { getDatabase } from '../db/database';
import type {
  Session,
  SessionDetail,
  SessionSummary,
} from '../models/session';
import type { Set } from '../models/set';

interface SessionRow {
  id: string;
  start_time: string;
  end_time: string | null;
  status: string;
  created_at: string;
}

interface SetRow {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  rir: number | null;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status as 'active' | 'complete',
    createdAt: row.created_at,
  };
}

function rowToSet(row: SetRow): Set {
  return {
    id: row.id,
    sessionId: row.session_id,
    exerciseId: row.exercise_id,
    setNumber: row.set_number,
    weight: row.weight,
    reps: row.reps,
    rir: row.rir,
    timestamp: row.timestamp,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createSession(): Promise<Session> {
  const db = await getDatabase();

  // Check for existing active session
  const active = await db.getFirstAsync<SessionRow>(
    "SELECT * FROM sessions WHERE status = 'active'",
  );
  if (active) {
    throw new Error(
      'An active session already exists. End it before starting a new one.',
    );
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO sessions (id, start_time, status, created_at)
     VALUES (?, ?, 'active', ?)`,
    id,
    now,
    now,
  );

  return {
    id,
    startTime: now,
    endTime: null,
    status: 'active',
    createdAt: now,
  };
}

export async function endSession(sessionId: string): Promise<Session> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE sessions SET end_time = ?, status = 'complete' WHERE id = ?`,
    now,
    sessionId,
  );

  const row = await db.getFirstAsync<SessionRow>(
    'SELECT * FROM sessions WHERE id = ?',
    sessionId,
  );
  if (!row) throw new Error(`Session not found: ${sessionId}`);

  return rowToSession(row);
}

export async function getActiveSession(): Promise<Session | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SessionRow>(
    "SELECT * FROM sessions WHERE status = 'active' LIMIT 1",
  );
  return row ? rowToSession(row) : null;
}

export async function listSessions(options: {
  limit?: number;
  offset?: number;
} = {}): Promise<Session[]> {
  const db = await getDatabase();
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  const rows = await db.getAllAsync<SessionRow>(
    `SELECT * FROM sessions
     WHERE status = 'complete'
     ORDER BY start_time DESC
     LIMIT ? OFFSET ?`,
    limit,
    offset,
  );

  return rows.map(rowToSession);
}

export async function getSessionDetail(
  sessionId: string,
): Promise<SessionDetail> {
  const db = await getDatabase();

  const sessionRow = await db.getFirstAsync<SessionRow>(
    'SELECT * FROM sessions WHERE id = ?',
    sessionId,
  );
  if (!sessionRow) throw new Error(`Session not found: ${sessionId}`);

  const setRows = await db.getAllAsync<SetRow>(
    'SELECT * FROM sets WHERE session_id = ? ORDER BY timestamp',
    sessionId,
  );

  const session = rowToSession(sessionRow);
  const sets = setRows.map(rowToSet);
  const summary = computeSummary(session, sets);

  return { ...session, sets, summary };
}

function computeSummary(session: Session, sets: Set[]): SessionSummary {
  const totalSets = sets.length;
  const totalVolume = sets.reduce(
    (sum, s) => sum + s.weight * s.reps,
    0,
  );
  const exerciseIds = new Set(sets.map((s) => s.exerciseId));
  const exerciseCount = exerciseIds.size;

  let duration = 0;
  if (session.endTime) {
    duration = Math.round(
      (new Date(session.endTime).getTime() -
        new Date(session.startTime).getTime()) /
        60000,
    );
  } else if (sets.length > 0) {
    const lastSet = sets[sets.length - 1];
    duration = Math.round(
      (new Date(lastSet.timestamp).getTime() -
        new Date(session.startTime).getTime()) /
        60000,
    );
  }

  return { totalSets, totalVolume, duration, exerciseCount };
}
