import { randomUUID } from 'expo-crypto';
import { getDatabase } from '../db/database';
import type {
  WorkoutTemplate,
  TemplateExercise,
  TemplateDetail,
} from '../models/template';

interface TemplateRow {
  id: string;
  name: string;
  style_tag: string | null;
  created_at: string;
  updated_at: string;
}

interface TemplateExerciseRow {
  id: string;
  template_id: string;
  exercise_id: string;
  ordinal: number;
  target_sets: number;
  target_reps: number;
  target_weight: number | null;
  exercise_name?: string;
}

function rowToTemplate(row: TemplateRow): WorkoutTemplate {
  return {
    id: row.id,
    name: row.name,
    styleTag: row.style_tag,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToExercise(row: TemplateExerciseRow): TemplateExercise & { exerciseName: string } {
  return {
    id: row.id,
    templateId: row.template_id,
    exerciseId: row.exercise_id,
    ordinal: row.ordinal,
    targetSets: row.target_sets,
    targetReps: row.target_reps,
    targetWeight: row.target_weight,
    exerciseName: row.exercise_name ?? '',
  };
}

export interface CreateTemplateInput {
  name: string;
  styleTag?: string;
  exercises: {
    exerciseId: string;
    targetSets: number;
    targetReps: number;
    targetWeight?: number;
  }[];
}

export interface UpdateTemplateInput {
  name?: string;
  styleTag?: string | null;
}

export async function createTemplate(
  input: CreateTemplateInput,
): Promise<TemplateDetail> {
  const db = await getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();

  await db.execAsync('BEGIN TRANSACTION');
  try {
    await db.runAsync(
      `INSERT INTO templates (id, name, style_tag, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      id, input.name, input.styleTag ?? null, now, now,
    );

    const exercises: (TemplateExercise & { exerciseName: string })[] = [];
    for (let i = 0; i < input.exercises.length; i++) {
      const ex = input.exercises[i];
      const exId = randomUUID();
      await db.runAsync(
        `INSERT INTO template_exercises
         (id, template_id, exercise_id, ordinal, target_sets, target_reps, target_weight)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        exId, id, ex.exerciseId, i, ex.targetSets, ex.targetReps,
        ex.targetWeight ?? null,
      );
      const nameRow = await db.getFirstAsync<{ name: string }>(
        'SELECT name FROM exercises WHERE id = ?', ex.exerciseId,
      );
      exercises.push({
        id: exId, templateId: id, exerciseId: ex.exerciseId,
        ordinal: i, targetSets: ex.targetSets, targetReps: ex.targetReps,
        targetWeight: ex.targetWeight ?? null,
        exerciseName: nameRow?.name ?? '',
      });
    }

    await db.execAsync('COMMIT');
    return {
      id, name: input.name, styleTag: input.styleTag ?? null,
      createdAt: now, updatedAt: now, exercises,
    };
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }
}

export async function listTemplates(
  styleTag?: string,
): Promise<WorkoutTemplate[]> {
  const db = await getDatabase();
  if (styleTag) {
    const rows = await db.getAllAsync<TemplateRow>(
      'SELECT * FROM templates WHERE style_tag = ? ORDER BY name',
      styleTag,
    );
    return rows.map(rowToTemplate);
  }
  const rows = await db.getAllAsync<TemplateRow>(
    'SELECT * FROM templates ORDER BY name',
  );
  return rows.map(rowToTemplate);
}

export async function getTemplateDetail(
  templateId: string,
): Promise<TemplateDetail> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TemplateRow>(
    'SELECT * FROM templates WHERE id = ?', templateId,
  );
  if (!row) throw new Error(`Template not found: ${templateId}`);
  const template = rowToTemplate(row);

  const exRows = await db.getAllAsync<TemplateExerciseRow>(
    `SELECT te.*, e.name AS exercise_name
     FROM template_exercises te
     JOIN exercises e ON e.id = te.exercise_id
     WHERE te.template_id = ?
     ORDER BY te.ordinal`,
    templateId,
  );

  return { ...template, exercises: exRows.map(rowToExercise) };
}

export async function updateTemplate(
  templateId: string,
  input: UpdateTemplateInput,
): Promise<WorkoutTemplate> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const updates: string[] = ['updated_at = ?'];
  const params: (string | null)[] = [now];

  if (input.name !== undefined) {
    updates.push('name = ?');
    params.push(input.name);
  }
  if (input.styleTag !== undefined) {
    updates.push('style_tag = ?');
    params.push(input.styleTag);
  }

  params.push(templateId);
  await db.runAsync(
    `UPDATE templates SET ${updates.join(', ')} WHERE id = ?`,
    ...params,
  );

  const row = await db.getFirstAsync<TemplateRow>(
    'SELECT * FROM templates WHERE id = ?', templateId,
  );
  if (!row) throw new Error(`Template not found: ${templateId}`);
  return rowToTemplate(row);
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM templates WHERE id = ?', templateId);
}

export async function addTemplateExercise(
  templateId: string,
  exerciseId: string,
  targetSets: number,
  targetReps: number,
  targetWeight?: number,
): Promise<TemplateExercise> {
  const db = await getDatabase();
  const countRow = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM template_exercises WHERE template_id = ?',
    templateId,
  );
  const ordinal = countRow?.c ?? 0;
  const id = randomUUID();

  await db.runAsync(
    `INSERT INTO template_exercises
     (id, template_id, exercise_id, ordinal, target_sets, target_reps, target_weight)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, templateId, exerciseId, ordinal, targetSets, targetReps,
    targetWeight ?? null,
  );

  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE templates SET updated_at = ? WHERE id = ?', now, templateId,
  );

  return {
    id, templateId, exerciseId, ordinal,
    targetSets, targetReps, targetWeight: targetWeight ?? null,
  };
}

export async function removeTemplateExercise(
  templateExerciseId: string,
): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TemplateExerciseRow>(
    'SELECT * FROM template_exercises WHERE id = ?', templateExerciseId,
  );
  if (!row) return;

  await db.runAsync(
    'DELETE FROM template_exercises WHERE id = ?', templateExerciseId,
  );

  const remaining = await db.getAllAsync<TemplateExerciseRow>(
    `SELECT * FROM template_exercises WHERE template_id = ? ORDER BY ordinal`,
    row.template_id,
  );
  for (let i = 0; i < remaining.length; i++) {
    await db.runAsync(
      'UPDATE template_exercises SET ordinal = ? WHERE id = ?',
      i, remaining[i].id,
    );
  }

  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE templates SET updated_at = ? WHERE id = ?', now, row.template_id,
  );
}

export async function moveTemplateExercise(
  templateExerciseId: string,
  direction: 'up' | 'down',
): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TemplateExerciseRow>(
    'SELECT * FROM template_exercises WHERE id = ?', templateExerciseId,
  );
  if (!row) return;

  const swapOrdinal = direction === 'up' ? row.ordinal - 1 : row.ordinal + 1;
  if (swapOrdinal < 0) return;

  const neighbor = await db.getFirstAsync<TemplateExerciseRow>(
    `SELECT * FROM template_exercises
     WHERE template_id = ? AND ordinal = ?`,
    row.template_id, swapOrdinal,
  );
  if (!neighbor) return;

  await db.execAsync('BEGIN TRANSACTION');
  try {
    await db.runAsync(
      'UPDATE template_exercises SET ordinal = ? WHERE id = ?',
      swapOrdinal, row.id,
    );
    await db.runAsync(
      'UPDATE template_exercises SET ordinal = ? WHERE id = ?',
      row.ordinal, neighbor.id,
    );
    const now = new Date().toISOString();
    await db.runAsync(
      'UPDATE templates SET updated_at = ? WHERE id = ?', now, row.template_id,
    );
    await db.execAsync('COMMIT');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }
}

export async function updateTemplateExercise(
  templateExerciseId: string,
  input: { targetSets?: number; targetReps?: number; targetWeight?: number | null },
): Promise<TemplateExercise> {
  const db = await getDatabase();
  const updates: string[] = [];
  const params: (number | null)[] = [];

  if (input.targetSets !== undefined) {
    updates.push('target_sets = ?');
    params.push(input.targetSets);
  }
  if (input.targetReps !== undefined) {
    updates.push('target_reps = ?');
    params.push(input.targetReps);
  }
  if (input.targetWeight !== undefined) {
    updates.push('target_weight = ?');
    params.push(input.targetWeight);
  }

  if (updates.length > 0) {
    params.push(templateExerciseId as unknown as number);
    await db.runAsync(
      `UPDATE template_exercises SET ${updates.join(', ')} WHERE id = ?`,
      ...params,
    );
  }

  const row = await db.getFirstAsync<TemplateExerciseRow>(
    'SELECT * FROM template_exercises WHERE id = ?', templateExerciseId,
  );
  if (!row) throw new Error(`Template exercise not found: ${templateExerciseId}`);

  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE templates SET updated_at = ? WHERE id = ?', now, row.template_id,
  );

  return {
    id: row.id, templateId: row.template_id, exerciseId: row.exercise_id,
    ordinal: row.ordinal, targetSets: row.target_sets,
    targetReps: row.target_reps, targetWeight: row.target_weight,
  };
}
