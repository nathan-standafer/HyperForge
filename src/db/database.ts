import * as SQLite from 'expo-sqlite';
import { migration001 } from './migrations/001-initial';
import { seedExercises } from './seed';

const DB_NAME = 'hyperforge.db';

let db: SQLite.SQLiteDatabase | null = null;
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const migrations = [migration001];

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  if (dbPromise) return dbPromise;
  dbPromise = initDatabase();
  return dbPromise;
}

async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const database = await SQLite.openDatabaseAsync(DB_NAME);
  await runMigrations(database);
  db = database;
  return database;
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const rows = await database.getAllAsync<{ version: number }>(
    'SELECT version FROM _migrations ORDER BY version',
  );
  const applied = new Set(rows.map((r) => r.version));

  for (let i = 0; i < migrations.length; i++) {
    const version = i + 1;
    if (!applied.has(version)) {
      await migrations[i](database);
      await database.runAsync(
        'INSERT INTO _migrations (version) VALUES (?)',
        version,
      );
    }
  }

  // Seed built-in exercises if the table is empty
  const count = await database.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM exercises',
  );
  if (count && count.c === 0) {
    await seedExercises(database);
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
