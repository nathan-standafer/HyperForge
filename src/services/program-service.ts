import { randomUUID } from 'expo-crypto';
import { getDatabase } from '../db/database';
import { getTemplateDetail } from './template-service';
import type {
  Program,
  ProgramDay,
  ProgramDetail,
  DayOfWeek,
} from '../models/program';
import type { TemplateDetail } from '../models/template';

interface ProgramRow {
  id: string;
  name: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface ProgramDayRow {
  id: string;
  program_id: string;
  day_of_week: number;
  template_id: string;
  template_name?: string;
}

function rowToProgram(row: ProgramRow): Program {
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToDay(row: ProgramDayRow): ProgramDay & { templateName: string } {
  return {
    id: row.id,
    programId: row.program_id,
    dayOfWeek: row.day_of_week as DayOfWeek,
    templateId: row.template_id,
    templateName: row.template_name ?? '',
  };
}

export interface CreateProgramInput {
  name: string;
  days: { dayOfWeek: DayOfWeek; templateId: string }[];
}

export async function createProgram(
  input: CreateProgramInput,
): Promise<ProgramDetail> {
  const db = await getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();

  await db.execAsync('BEGIN TRANSACTION');
  try {
    await db.runAsync(
      `INSERT INTO programs (id, name, is_active, created_at, updated_at)
       VALUES (?, ?, 0, ?, ?)`,
      id, input.name, now, now,
    );
    const days: (ProgramDay & { templateName: string })[] = [];
    for (const d of input.days) {
      const dayId = randomUUID();
      await db.runAsync(
        `INSERT INTO program_days (id, program_id, day_of_week, template_id)
         VALUES (?, ?, ?, ?)`,
        dayId, id, d.dayOfWeek, d.templateId,
      );
      const tpl = await db.getFirstAsync<{ name: string }>(
        'SELECT name FROM templates WHERE id = ?', d.templateId,
      );
      days.push({
        id: dayId, programId: id, dayOfWeek: d.dayOfWeek,
        templateId: d.templateId, templateName: tpl?.name ?? '',
      });
    }
    await db.execAsync('COMMIT');
    return { id, name: input.name, isActive: false, createdAt: now, updatedAt: now, days };
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }
}

export async function listPrograms(): Promise<Program[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ProgramRow>(
    'SELECT * FROM programs ORDER BY name',
  );
  return rows.map(rowToProgram);
}

export async function getProgramDetail(
  programId: string,
): Promise<ProgramDetail> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ProgramRow>(
    'SELECT * FROM programs WHERE id = ?', programId,
  );
  if (!row) throw new Error(`Program not found: ${programId}`);
  const program = rowToProgram(row);

  const dayRows = await db.getAllAsync<ProgramDayRow>(
    `SELECT pd.*, t.name AS template_name
     FROM program_days pd
     JOIN templates t ON t.id = pd.template_id
     WHERE pd.program_id = ?
     ORDER BY pd.day_of_week`,
    programId,
  );
  return { ...program, days: dayRows.map(rowToDay) };
}

export async function deleteProgram(programId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM programs WHERE id = ?', programId);
}

export async function setActiveProgram(programId: string): Promise<void> {
  const db = await getDatabase();
  await db.execAsync('BEGIN TRANSACTION');
  try {
    await db.runAsync('UPDATE programs SET is_active = 0');
    await db.runAsync(
      'UPDATE programs SET is_active = 1 WHERE id = ?', programId,
    );
    await db.execAsync('COMMIT');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }
}

export async function clearActiveProgram(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE programs SET is_active = 0');
}

export async function assignDay(
  programId: string,
  dayOfWeek: DayOfWeek,
  templateId: string,
): Promise<ProgramDay> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<ProgramDayRow>(
    `SELECT * FROM program_days WHERE program_id = ? AND day_of_week = ?`,
    programId, dayOfWeek,
  );
  if (existing) {
    await db.runAsync(
      'UPDATE program_days SET template_id = ? WHERE id = ?',
      templateId, existing.id,
    );
    return { id: existing.id, programId, dayOfWeek, templateId };
  }
  const id = randomUUID();
  await db.runAsync(
    `INSERT INTO program_days (id, program_id, day_of_week, template_id)
     VALUES (?, ?, ?, ?)`,
    id, programId, dayOfWeek, templateId,
  );
  return { id, programId, dayOfWeek, templateId };
}

export async function unassignDay(
  programId: string,
  dayOfWeek: DayOfWeek,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM program_days WHERE program_id = ? AND day_of_week = ?',
    programId, dayOfWeek,
  );
}

export interface TodaySuggestion {
  template: TemplateDetail;
  alreadyCompleted: boolean;
}

export async function getTodaySuggestion(): Promise<TodaySuggestion | null> {
  const db = await getDatabase();
  const activeProgram = await db.getFirstAsync<ProgramRow>(
    'SELECT * FROM programs WHERE is_active = 1 LIMIT 1',
  );
  if (!activeProgram) return null;

  const jsDay = new Date().getDay(); // 0=Sun
  const isoDay = ((jsDay + 6) % 7) as DayOfWeek; // 0=Mon

  const dayRow = await db.getFirstAsync<ProgramDayRow>(
    `SELECT * FROM program_days WHERE program_id = ? AND day_of_week = ?`,
    activeProgram.id, isoDay,
  );
  if (!dayRow) return null;

  const template = await getTemplateDetail(dayRow.template_id);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const sessionToday = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM sessions
     WHERE template_id = ?
       AND start_time >= ?
       AND start_time <= ?
     LIMIT 1`,
    dayRow.template_id, todayStart.toISOString(), todayEnd.toISOString(),
  );

  return { template, alreadyCompleted: !!sessionToday };
}
