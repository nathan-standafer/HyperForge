import { randomUUID } from 'expo-crypto';
import { getDatabase } from '../db/database';
import { createSession } from './session-service';
import type { Session } from '../models/session';
import type { SessionTarget } from '../models/session-target';

interface TemplateExerciseRow {
  id: string;
  exercise_id: string;
  ordinal: number;
  target_sets: number;
  target_reps: number;
  target_weight: number | null;
  exercise_exists: number;
}

interface SessionTargetRow {
  id: string;
  session_id: string;
  exercise_id: string;
  ordinal: number;
  target_sets: number;
  target_reps: number;
  target_weight: number | null;
}

function rowToTarget(row: SessionTargetRow): SessionTarget {
  return {
    id: row.id,
    sessionId: row.session_id,
    exerciseId: row.exercise_id,
    ordinal: row.ordinal,
    targetSets: row.target_sets,
    targetReps: row.target_reps,
    targetWeight: row.target_weight,
  };
}

export async function startSessionFromTemplate(
  templateId: string,
): Promise<{ session: Session; targets: SessionTarget[]; warnings: string[] }> {
  const session = await createSession();
  const db = await getDatabase();
  const warnings: string[] = [];

  await db.runAsync(
    'UPDATE sessions SET template_id = ? WHERE id = ?',
    templateId,
    session.id,
  );

  const rows = await db.getAllAsync<TemplateExerciseRow>(
    `SELECT te.id, te.exercise_id, te.ordinal,
            te.target_sets, te.target_reps, te.target_weight,
            (CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END) AS exercise_exists
     FROM template_exercises te
     LEFT JOIN exercises e ON e.id = te.exercise_id
     WHERE te.template_id = ?
     ORDER BY te.ordinal`,
    templateId,
  );

  const targets: SessionTarget[] = [];
  let ordinal = 0;
  for (const row of rows) {
    if (!row.exercise_exists) {
      warnings.push(`Skipped deleted exercise (ID: ${row.exercise_id})`);
      continue;
    }
    const targetId = randomUUID();
    await db.runAsync(
      `INSERT INTO session_targets
       (id, session_id, exercise_id, ordinal, target_sets, target_reps, target_weight)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      targetId,
      session.id,
      row.exercise_id,
      ordinal,
      row.target_sets,
      row.target_reps,
      row.target_weight,
    );
    targets.push({
      id: targetId,
      sessionId: session.id,
      exerciseId: row.exercise_id,
      ordinal,
      targetSets: row.target_sets,
      targetReps: row.target_reps,
      targetWeight: row.target_weight,
    });
    ordinal++;
  }

  return { session, targets, warnings };
}

export async function getSessionTargets(
  sessionId: string,
): Promise<SessionTarget[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SessionTargetRow>(
    `SELECT * FROM session_targets
     WHERE session_id = ?
     ORDER BY ordinal`,
    sessionId,
  );
  return rows.map(rowToTarget);
}
