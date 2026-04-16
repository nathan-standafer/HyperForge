jest.mock('expo-sqlite', () => {
  const exercises: unknown[] = [];
  return {
    openDatabaseAsync: jest.fn().mockResolvedValue({
      execAsync: jest.fn(),
      runAsync: jest.fn().mockImplementation(async (sql: string, ...args: unknown[]) => {
        if (sql.includes('INSERT INTO exercises')) {
          exercises.push({
            id: args[0],
            name: args[1],
            muscle_group: args[2],
            is_built_in: 0,
            is_favorite: 0,
            created_at: args[3],
          });
        }
      }),
      getAllAsync: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('FROM exercises')) return exercises;
        return [];
      }),
      getFirstAsync: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('COUNT')) return { c: exercises.length };
        if (sql.includes('FROM exercises WHERE id')) return exercises[exercises.length - 1] ?? null;
        return null;
      }),
      closeAsync: jest.fn(),
    }),
  };
});

jest.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).slice(2, 8),
}));

import { createExercise, listExercises } from '../../src/services/exercise-service';

describe('exercise-service', () => {
  describe('createExercise', () => {
    it('creates a custom exercise with name and muscle group', async () => {
      const exercise = await createExercise({
        name: 'Bulgarian Split Squat',
        muscleGroup: 'quads',
      });
      expect(exercise.name).toBe('Bulgarian Split Squat');
      expect(exercise.muscleGroup).toBe('quads');
      expect(exercise.isBuiltIn).toBe(false);
    });

    it('trims whitespace from exercise name', async () => {
      const exercise = await createExercise({
        name: '  Pendlay Row  ',
        muscleGroup: 'back',
      });
      expect(exercise.name).toBe('Pendlay Row');
    });
  });

  describe('listExercises', () => {
    it('returns an array of exercises', async () => {
      const exercises = await listExercises();
      expect(Array.isArray(exercises)).toBe(true);
    });
  });
});
