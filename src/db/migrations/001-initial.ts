import type * as SQLite from 'expo-sqlite';

export async function migration001(
  db: SQLite.SQLiteDatabase,
): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      is_built_in INTEGER NOT NULL DEFAULT 0,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(name COLLATE NOCASE)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      start_time TEXT NOT NULL,
      end_time TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_status
      ON sessions(status);

    CREATE TABLE IF NOT EXISTS sets (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      rir INTEGER,
      timestamp TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sets_session
      ON sets(session_id);

    CREATE INDEX IF NOT EXISTS idx_sets_exercise_time
      ON sets(exercise_id, timestamp DESC);
  `);
}
