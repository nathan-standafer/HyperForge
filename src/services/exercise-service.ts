import { randomUUID } from 'expo-crypto';
import { getDatabase } from '../db/database';
import type { Exercise, MuscleGroup, MUSCLE_GROUPS } from '../models/exercise';

interface ListExercisesOptions {
  muscleGroup?: MuscleGroup;
  searchQuery?: string;
  favoritesOnly?: boolean;
}

interface ExerciseRow {
  id: string;
  name: string;
  muscle_group: string;
  is_built_in: number;
  is_favorite: number;
  created_at: string;
}

function rowToExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group as MuscleGroup,
    isBuiltIn: row.is_built_in === 1,
    isFavorite: row.is_favorite === 1,
    createdAt: row.created_at,
  };
}

export async function listExercises(
  options?: ListExercisesOptions,
): Promise<Exercise[]> {
  const db = await getDatabase();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options?.muscleGroup) {
    conditions.push('muscle_group = ?');
    params.push(options.muscleGroup);
  }
  if (options?.searchQuery) {
    conditions.push('name LIKE ?');
    params.push(`%${options.searchQuery}%`);
  }
  if (options?.favoritesOnly) {
    conditions.push('is_favorite = 1');
  }

  const where = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const rows = await db.getAllAsync<ExerciseRow>(
    `SELECT * FROM exercises ${where} ORDER BY name`,
    ...params,
  );
  return rows.map(rowToExercise);
}

export async function getRecentExercises(): Promise<Exercise[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ExerciseRow>(
    `SELECT DISTINCT e.* FROM exercises e
     INNER JOIN sets s ON s.exercise_id = e.id
     ORDER BY s.timestamp DESC
     LIMIT 10`,
  );
  return rows.map(rowToExercise);
}

export async function createExercise(input: {
  name: string;
  muscleGroup: MuscleGroup;
}): Promise<Exercise> {
  const db = await getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO exercises (id, name, muscle_group, is_built_in, is_favorite, created_at)
     VALUES (?, ?, ?, 0, 0, ?)`,
    id,
    input.name.trim(),
    input.muscleGroup,
    now,
  );

  return {
    id,
    name: input.name.trim(),
    muscleGroup: input.muscleGroup,
    isBuiltIn: false,
    isFavorite: false,
    createdAt: now,
  };
}

export async function toggleFavorite(
  exerciseId: string,
): Promise<Exercise> {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE exercises SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END
     WHERE id = ?`,
    exerciseId,
  );

  const row = await db.getFirstAsync<ExerciseRow>(
    'SELECT * FROM exercises WHERE id = ?',
    exerciseId,
  );
  if (!row) throw new Error(`Exercise not found: ${exerciseId}`);

  return rowToExercise(row);
}
