const programs: Record<string, { id: string; name: string; is_active: number; created_at: string; updated_at: string }> = {};
const programDays: { id: string; program_id: string; day_of_week: number; template_id: string; template_name?: string }[] = [];
const templates: Record<string, { id: string; name: string; style_tag: string | null; created_at: string; updated_at: string }> = {
  'tpl-1': { id: 'tpl-1', name: 'Push', style_tag: 'Push', created_at: '', updated_at: '' },
  'tpl-2': { id: 'tpl-2', name: 'Pull', style_tag: 'Pull', created_at: '', updated_at: '' },
};

jest.mock('expo-crypto', () => {
  let c = 0;
  return { randomUUID: () => `prog-uuid-${++c}` };
});

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn(),
    runAsync: jest.fn().mockImplementation(async (sql: string, ...args: unknown[]) => {
      if (sql.includes('INSERT INTO programs ')) {
        programs[args[0] as string] = {
          id: args[0] as string, name: args[1] as string,
          is_active: 0, created_at: args[2] as string, updated_at: args[3] as string,
        };
      }
      if (sql.includes('INSERT INTO program_days')) {
        programDays.push({
          id: args[0] as string, program_id: args[1] as string,
          day_of_week: args[2] as number, template_id: args[3] as string,
        });
      }
      if (sql.includes('DELETE FROM programs WHERE')) {
        const id = args[0] as string;
        delete programs[id];
        const idxs = programDays.map((d, i) => d.program_id === id ? i : -1).filter(i => i >= 0).reverse();
        for (const i of idxs) programDays.splice(i, 1);
      }
      if (sql.includes('UPDATE programs SET is_active = 0') && args.length === 0) {
        for (const p of Object.values(programs)) p.is_active = 0;
      }
      if (sql.includes('UPDATE programs SET is_active = 1')) {
        const p = programs[args[0] as string];
        if (p) p.is_active = 1;
      }
    }),
    getAllAsync: jest.fn().mockImplementation(async (sql: string, ...args: unknown[]) => {
      if (sql.includes('FROM programs ORDER')) {
        return Object.values(programs).sort((a, b) => a.name.localeCompare(b.name));
      }
      if (sql.includes('FROM program_days pd') && sql.includes('JOIN templates')) {
        return programDays
          .filter(d => d.program_id === args[0])
          .sort((a, b) => a.day_of_week - b.day_of_week)
          .map(d => ({ ...d, template_name: templates[d.template_id]?.name ?? '' }));
      }
      if (sql.includes('FROM template_exercises te') && sql.includes('JOIN exercises')) return [];
      return [];
    }),
    getFirstAsync: jest.fn().mockImplementation(async (sql: string, ...args: unknown[]) => {
      if (sql.includes('FROM programs WHERE id')) return programs[args[0] as string] ?? null;
      if (sql.includes('FROM programs WHERE is_active')) return Object.values(programs).find(p => p.is_active === 1) ?? null;
      if (sql.includes('FROM templates WHERE id')) return templates[args[0] as string] ?? null;
      if (sql.includes('FROM program_days WHERE program_id') && sql.includes('day_of_week')) {
        return programDays.find(d => d.program_id === args[0] && d.day_of_week === args[1]) ?? null;
      }
      if (sql.includes('FROM sessions WHERE template_id')) return null; // no sessions by default
      return null;
    }),
    closeAsync: jest.fn(),
  }),
}));

import {
  createProgram,
  listPrograms,
  deleteProgram,
  setActiveProgram,
  clearActiveProgram,
  getTodaySuggestion,
} from '../../src/services/program-service';

function clearData() {
  for (const k of Object.keys(programs)) delete programs[k];
  programDays.splice(0, programDays.length);
}

describe('program-service', () => {
  beforeEach(clearData);

  it('createProgram inserts program + days', async () => {
    const result = await createProgram({
      name: 'PPL',
      days: [
        { dayOfWeek: 0, templateId: 'tpl-1' },
        { dayOfWeek: 2, templateId: 'tpl-2' },
      ],
    });
    expect(result.name).toBe('PPL');
    expect(result.days).toHaveLength(2);
    expect(result.days[0].dayOfWeek).toBe(0);
  });

  it('listPrograms returns alphabetically', async () => {
    await createProgram({ name: 'Zzz', days: [] });
    await createProgram({ name: 'Aaa', days: [] });
    const list = await listPrograms();
    expect(list.map(p => p.name)).toEqual(['Aaa', 'Zzz']);
  });

  it('setActiveProgram deactivates others', async () => {
    const a = await createProgram({ name: 'A', days: [] });
    const b = await createProgram({ name: 'B', days: [] });
    await setActiveProgram(a.id);
    expect(programs[a.id].is_active).toBe(1);
    await setActiveProgram(b.id);
    expect(programs[a.id].is_active).toBe(0);
    expect(programs[b.id].is_active).toBe(1);
  });

  it('clearActiveProgram deactivates all', async () => {
    const a = await createProgram({ name: 'A', days: [] });
    await setActiveProgram(a.id);
    await clearActiveProgram();
    expect(programs[a.id].is_active).toBe(0);
  });

  it('deleteProgram removes program and days', async () => {
    const p = await createProgram({
      name: 'Del',
      days: [{ dayOfWeek: 0, templateId: 'tpl-1' }],
    });
    await deleteProgram(p.id);
    expect(Object.keys(programs)).toHaveLength(0);
    expect(programDays).toHaveLength(0);
  });

  it('getTodaySuggestion returns null with no active program', async () => {
    const result = await getTodaySuggestion();
    expect(result).toBeNull();
  });
});
