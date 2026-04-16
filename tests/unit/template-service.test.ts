const templates: Record<string, { id: string; name: string; style_tag: string | null; created_at: string; updated_at: string }> = {};
const templateExercises: { id: string; template_id: string; exercise_id: string; ordinal: number; target_sets: number; target_reps: number; target_weight: number | null }[] = [];
const exercises: { id: string; name: string }[] = [
  { id: 'ex-bench', name: 'Bench Press' },
  { id: 'ex-ohp', name: 'Overhead Press' },
  { id: 'ex-dip', name: 'Tricep Dip' },
];

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `uuid-${++counter}` };
});

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn(),
    runAsync: jest.fn().mockImplementation(async (sql: string, ...args: unknown[]) => {
      if (sql.includes('INSERT INTO templates ')) {
        templates[args[0] as string] = {
          id: args[0] as string, name: args[1] as string,
          style_tag: args[2] as string | null,
          created_at: args[3] as string, updated_at: args[4] as string,
        };
      }
      if (sql.includes('INSERT INTO template_exercises')) {
        templateExercises.push({
          id: args[0] as string, template_id: args[1] as string,
          exercise_id: args[2] as string, ordinal: args[3] as number,
          target_sets: args[4] as number, target_reps: args[5] as number,
          target_weight: args[6] as number | null,
        });
      }
      if (sql.includes('DELETE FROM templates')) {
        delete templates[args[0] as string];
        const tid = args[0] as string;
        const idxs = templateExercises
          .map((e, i) => (e.template_id === tid ? i : -1))
          .filter((i) => i >= 0)
          .reverse();
        for (const i of idxs) templateExercises.splice(i, 1);
      }
      if (sql.includes('DELETE FROM template_exercises WHERE id')) {
        const idx = templateExercises.findIndex((e) => e.id === args[0]);
        if (idx >= 0) templateExercises.splice(idx, 1);
      }
      if (sql.includes('UPDATE template_exercises SET ordinal')) {
        const te = templateExercises.find((e) => e.id === args[1]);
        if (te) te.ordinal = args[0] as number;
      }
      if (sql.includes('UPDATE templates SET')) {
        const id = args[args.length - 1] as string;
        const t = templates[id];
        if (t && sql.includes('name =')) t.name = args[1] as string;
      }
    }),
    getAllAsync: jest.fn().mockImplementation(async (sql: string, ...args: unknown[]) => {
      if (sql.includes('FROM templates') && sql.includes('style_tag = ?')) {
        return Object.values(templates)
          .filter((t) => t.style_tag === args[0])
          .sort((a, b) => a.name.localeCompare(b.name));
      }
      if (sql.includes('FROM templates')) {
        return Object.values(templates).sort((a, b) => a.name.localeCompare(b.name));
      }
      if (sql.includes('FROM template_exercises te') && sql.includes('JOIN exercises')) {
        return templateExercises
          .filter((te) => te.template_id === args[0])
          .sort((a, b) => a.ordinal - b.ordinal)
          .map((te) => ({
            ...te, exercise_name: exercises.find((e) => e.id === te.exercise_id)?.name ?? '',
          }));
      }
      if (sql.includes('FROM template_exercises WHERE template_id')) {
        return templateExercises
          .filter((te) => te.template_id === args[0])
          .sort((a, b) => a.ordinal - b.ordinal);
      }
      return [];
    }),
    getFirstAsync: jest.fn().mockImplementation(async (sql: string, ...args: unknown[]) => {
      if (sql.includes('FROM templates WHERE id')) return templates[args[0] as string] ?? null;
      if (sql.includes('FROM template_exercises WHERE id')) return templateExercises.find((e) => e.id === args[0]) ?? null;
      if (sql.includes('COUNT') && sql.includes('template_exercises')) {
        return { c: templateExercises.filter((e) => e.template_id === args[0]).length };
      }
      if (sql.includes('FROM template_exercises') && sql.includes('ordinal = ?')) {
        return templateExercises.find((e) => e.template_id === args[0] && e.ordinal === args[1]) ?? null;
      }
      if (sql.includes('FROM exercises WHERE id')) return exercises.find((e) => e.id === args[0]) ?? null;
      return null;
    }),
    closeAsync: jest.fn(),
  }),
}));

import {
  createTemplate,
  listTemplates,
  getTemplateDetail,
  deleteTemplate,
  moveTemplateExercise,
  removeTemplateExercise,
} from '../../src/services/template-service';

function clearData() {
  for (const k of Object.keys(templates)) delete templates[k];
  templateExercises.splice(0, templateExercises.length);
}

describe('template-service', () => {
  beforeEach(clearData);

  it('createTemplate inserts template + exercises with ordinals', async () => {
    const result = await createTemplate({
      name: 'Push Day',
      styleTag: 'Push',
      exercises: [
        { exerciseId: 'ex-bench', targetSets: 4, targetReps: 8 },
        { exerciseId: 'ex-ohp', targetSets: 3, targetReps: 10, targetWeight: 40 },
      ],
    });
    expect(result.name).toBe('Push Day');
    expect(result.exercises).toHaveLength(2);
    expect(result.exercises[0].ordinal).toBe(0);
    expect(result.exercises[1].ordinal).toBe(1);
    expect(result.exercises[1].targetWeight).toBe(40);
  });

  it('listTemplates returns alphabetically, filterable by tag', async () => {
    await createTemplate({ name: 'Zzz', exercises: [] });
    await createTemplate({ name: 'Aaa', styleTag: 'Pull', exercises: [] });
    const all = await listTemplates();
    expect(all.map((t) => t.name)).toEqual(['Aaa', 'Zzz']);
    const filtered = await listTemplates('Pull');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Aaa');
  });

  it('getTemplateDetail joins exercise names', async () => {
    const created = await createTemplate({
      name: 'Test',
      exercises: [{ exerciseId: 'ex-bench', targetSets: 3, targetReps: 10 }],
    });
    const detail = await getTemplateDetail(created.id);
    expect(detail.exercises[0].exerciseName).toBe('Bench Press');
  });

  it('deleteTemplate removes template and exercises', async () => {
    const created = await createTemplate({
      name: 'Del',
      exercises: [{ exerciseId: 'ex-bench', targetSets: 1, targetReps: 1 }],
    });
    await deleteTemplate(created.id);
    const all = await listTemplates();
    expect(all).toHaveLength(0);
    expect(templateExercises).toHaveLength(0);
  });

  it('moveTemplateExercise swaps ordinals', async () => {
    const created = await createTemplate({
      name: 'Move',
      exercises: [
        { exerciseId: 'ex-bench', targetSets: 3, targetReps: 8 },
        { exerciseId: 'ex-ohp', targetSets: 3, targetReps: 10 },
      ],
    });
    const firstId = created.exercises[0].id;
    await moveTemplateExercise(firstId, 'down');
    const te = templateExercises.filter((e) => e.template_id === created.id);
    const first = te.find((e) => e.id === firstId);
    expect(first?.ordinal).toBe(1);
  });

  it('moveTemplateExercise no-ops at boundary', async () => {
    const created = await createTemplate({
      name: 'Boundary',
      exercises: [{ exerciseId: 'ex-bench', targetSets: 1, targetReps: 1 }],
    });
    await moveTemplateExercise(created.exercises[0].id, 'up');
    expect(templateExercises[0].ordinal).toBe(0);
  });

  it('removeTemplateExercise renumbers ordinals', async () => {
    const created = await createTemplate({
      name: 'Renumber',
      exercises: [
        { exerciseId: 'ex-bench', targetSets: 1, targetReps: 1 },
        { exerciseId: 'ex-ohp', targetSets: 1, targetReps: 1 },
        { exerciseId: 'ex-dip', targetSets: 1, targetReps: 1 },
      ],
    });
    await removeTemplateExercise(created.exercises[1].id);
    const remaining = templateExercises
      .filter((e) => e.template_id === created.id)
      .sort((a, b) => a.ordinal - b.ordinal);
    expect(remaining).toHaveLength(2);
    expect(remaining[0].ordinal).toBe(0);
    expect(remaining[1].ordinal).toBe(1);
  });
});
