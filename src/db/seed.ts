import type * as SQLite from 'expo-sqlite';
import { v4 as uuid } from 'uuid';
import type { MuscleGroup } from '../models/exercise';

interface SeedExercise {
  name: string;
  muscleGroup: MuscleGroup;
}

const BUILT_IN_EXERCISES: SeedExercise[] = [
  // Chest
  { name: 'Barbell Bench Press', muscleGroup: 'chest' },
  { name: 'Dumbbell Bench Press', muscleGroup: 'chest' },
  { name: 'Incline Bench Press', muscleGroup: 'chest' },
  { name: 'Cable Fly', muscleGroup: 'chest' },
  // Back
  { name: 'Barbell Row', muscleGroup: 'back' },
  { name: 'Pull-Up', muscleGroup: 'back' },
  { name: 'Lat Pulldown', muscleGroup: 'back' },
  { name: 'Seated Cable Row', muscleGroup: 'back' },
  // Shoulders
  { name: 'Overhead Press', muscleGroup: 'shoulders' },
  { name: 'Lateral Raise', muscleGroup: 'shoulders' },
  { name: 'Face Pull', muscleGroup: 'shoulders' },
  // Biceps
  { name: 'Barbell Curl', muscleGroup: 'biceps' },
  { name: 'Dumbbell Curl', muscleGroup: 'biceps' },
  // Triceps
  { name: 'Tricep Pushdown', muscleGroup: 'triceps' },
  { name: 'Skull Crusher', muscleGroup: 'triceps' },
  // Quads
  { name: 'Barbell Squat', muscleGroup: 'quads' },
  { name: 'Leg Press', muscleGroup: 'quads' },
  { name: 'Leg Extension', muscleGroup: 'quads' },
  // Hamstrings
  { name: 'Romanian Deadlift', muscleGroup: 'hamstrings' },
  { name: 'Leg Curl', muscleGroup: 'hamstrings' },
  // Glutes
  { name: 'Hip Thrust', muscleGroup: 'glutes' },
  // Calves
  { name: 'Calf Raise', muscleGroup: 'calves' },
  // Core
  { name: 'Plank', muscleGroup: 'core' },
  { name: 'Cable Crunch', muscleGroup: 'core' },
  // Full Body
  { name: 'Deadlift', muscleGroup: 'full_body' },
];

export async function seedExercises(
  db: SQLite.SQLiteDatabase,
): Promise<void> {
  for (const exercise of BUILT_IN_EXERCISES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO exercises (id, name, muscle_group, is_built_in, is_favorite)
       VALUES (?, ?, ?, 1, 0)`,
      uuid(),
      exercise.name,
      exercise.muscleGroup,
    );
  }
}
