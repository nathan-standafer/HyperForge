import { randomUUID } from 'expo-crypto';
import { getDatabase } from '../db/database';
import type { Set, LogSetInput, UpdateSetInput } from '../models/set';

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

export async function logSet(input: LogSetInput): Promise<Set> {
  if (input.weight < 0) throw new Error('Weight must be >= 0');
  if (input.reps < 1) throw new Error('Reps must be >= 1');
  if (input.rir !== undefined && (input.rir < 0 || input.rir > 10)) {
    throw new Error('RIR must be 0-10');
  }

  const db = await getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();

  // Auto-assign set number
  const countRow = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM sets
     WHERE session_id = ? AND exercise_id = ?`,
    input.sessionId,
    input.exerciseId,
  );
  const setNumber = (countRow?.c ?? 0) + 1;

  await db.runAsync(
    `INSERT INTO sets (id, session_id, exercise_id, set_number, weight, reps, rir, timestamp, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.sessionId,
    input.exerciseId,
    setNumber,
    input.weight,
    input.reps,
    input.rir ?? null,
    now,
    now,
    now,
  );

  return {
    id,
    sessionId: input.sessionId,
    exerciseId: input.exerciseId,
    setNumber,
    weight: input.weight,
    reps: input.reps,
    rir: input.rir ?? null,
    timestamp: now,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateSet(
  setId: string,
  input: UpdateSetInput,
): Promise<Set> {
  if (input.weight !== undefined && input.weight < 0) {
    throw new Error('Weight must be >= 0');
  }
  if (input.reps !== undefined && input.reps < 1) {
    throw new Error('Reps must be >= 1');
  }
  if (input.rir !== undefined && input.rir !== null && (input.rir < 0 || input.rir > 10)) {
    throw new Error('RIR must be 0-10');
  }

  const db = await getDatabase();
  const now = new Date().toISOString();

  const updates: string[] = ['updated_at = ?'];
  const params: (string | number | null)[] = [now];

  if (input.weight !== undefined) {
    updates.push('weight = ?');
    params.push(input.weight);
  }
  if (input.reps !== undefined) {
    updates.push('reps = ?');
    params.push(input.reps);
  }
  if (input.rir !== undefined) {
    updates.push('rir = ?');
    params.push(input.rir);
  }

  params.push(setId);
  await db.runAsync(
    `UPDATE sets SET ${updates.join(', ')} WHERE id = ?`,
    ...params,
  );

  const row = await db.getFirstAsync<SetRow>(
    'SELECT * FROM sets WHERE id = ?',
    setId,
  );
  if (!row) throw new Error(`Set not found: ${setId}`);

  return rowToSet(row);
}

export async function deleteSet(setId: string): Promise<void> {
  const db = await getDatabase();

  // Get the set to know session/exercise for renumbering
  const existing = await db.getFirstAsync<SetRow>(
    'SELECT * FROM sets WHERE id = ?',
    setId,
  );
  if (!existing) throw new Error(`Set not found: ${setId}`);

  await db.runAsync('DELETE FROM sets WHERE id = ?', setId);

  // Renumber remaining sets for the same exercise in the same session
  const remaining = await db.getAllAsync<SetRow>(
    `SELECT * FROM sets
     WHERE session_id = ? AND exercise_id = ?
     ORDER BY timestamp`,
    existing.session_id,
    existing.exercise_id,
  );

  for (let i = 0; i < remaining.length; i++) {
    await db.runAsync(
      'UPDATE sets SET set_number = ? WHERE id = ?',
      i + 1,
      remaining[i].id,
    );
  }
}

export async function getLastSetForExercise(
  exerciseId: string,
): Promise<Set | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SetRow>(
    `SELECT * FROM sets
     WHERE exercise_id = ?
     ORDER BY timestamp DESC
     LIMIT 1`,
    exerciseId,
  );
  return row ? rowToSet(row) : null;
}

export async function getSetsForSession(
  sessionId: string,
): Promise<Set[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SetRow>(
    `SELECT * FROM sets
     WHERE session_id = ?
     ORDER BY timestamp`,
    sessionId,
  );
  return rows.map(rowToSet);
}
