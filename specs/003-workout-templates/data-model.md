# Data Model: Workout Templates & Programs

## New Tables

### templates

| Column     | Type    | Constraints                            |
|------------|---------|----------------------------------------|
| id         | TEXT    | PRIMARY KEY                            |
| name       | TEXT    | NOT NULL, max 100 chars                |
| style_tag  | TEXT    | Nullable; free-text (e.g., "Push")     |
| created_at | TEXT    | NOT NULL, ISO 8601                     |
| updated_at | TEXT    | NOT NULL, ISO 8601                     |

**Validation**:
- name MUST be non-empty.
- Duplicate names are allowed (distinguished by id).

### template_exercises

| Column        | Type    | Constraints                          |
|---------------|---------|--------------------------------------|
| id            | TEXT    | PRIMARY KEY                          |
| template_id   | TEXT    | NOT NULL, FK → templates.id ON DELETE CASCADE |
| exercise_id   | TEXT    | NOT NULL, FK → exercises.id          |
| ordinal       | INTEGER | NOT NULL, ≥ 0                        |
| target_sets   | INTEGER | NOT NULL, ≥ 1                        |
| target_reps   | INTEGER | NOT NULL, ≥ 1                        |
| target_weight | REAL    | Nullable, ≥ 0 when present           |

**Validation**:
- target_sets ≥ 1, target_reps ≥ 1.
- target_weight, if provided, must be ≥ 0.
- ordinal is unique within a template and zero-based.
- On reorder, ordinals are renumbered.

**Index**: `(template_id, ordinal)`.

### programs

| Column     | Type    | Constraints                            |
|------------|---------|----------------------------------------|
| id         | TEXT    | PRIMARY KEY                            |
| name       | TEXT    | NOT NULL, max 100 chars                |
| is_active  | INTEGER | NOT NULL, default 0 (boolean)          |
| created_at | TEXT    | NOT NULL, ISO 8601                     |
| updated_at | TEXT    | NOT NULL, ISO 8601                     |

**Constraint**: At most one row may have `is_active = 1` at any
time. Enforced at the service layer: setting a program active
deactivates all others in a transaction.

### program_days

| Column      | Type    | Constraints                           |
|-------------|---------|---------------------------------------|
| id          | TEXT    | PRIMARY KEY                           |
| program_id  | TEXT    | NOT NULL, FK → programs.id ON DELETE CASCADE |
| day_of_week | INTEGER | NOT NULL, 0=Monday … 6=Sunday         |
| template_id | TEXT    | NOT NULL, FK → templates.id           |

**Unique constraint**: `(program_id, day_of_week)` — one template
per day per program.

**Index**: `(program_id, day_of_week)`.

### session_targets

Snapshot of template exercises at session-start time. Write-once,
read-only.

| Column        | Type    | Constraints                          |
|---------------|---------|--------------------------------------|
| id            | TEXT    | PRIMARY KEY                          |
| session_id    | TEXT    | NOT NULL, FK → sessions.id ON DELETE CASCADE |
| exercise_id   | TEXT    | NOT NULL, FK → exercises.id          |
| ordinal       | INTEGER | NOT NULL, ≥ 0                        |
| target_sets   | INTEGER | NOT NULL, ≥ 1                        |
| target_reps   | INTEGER | NOT NULL, ≥ 1                        |
| target_weight | REAL    | Nullable                             |

**Index**: `(session_id, ordinal)`.

## Altered Tables

### sessions (migration 002)

| New Column  | Type | Constraints                              |
|-------------|------|------------------------------------------|
| template_id | TEXT | Nullable, FK → templates.id              |

Existing columns unchanged. `template_id` is set when a session is
started from a template; null for blank sessions.

## Relationships

```text
WorkoutTemplate 1──* TemplateExercise *──1 Exercise
Program 1──* ProgramDay *──1 WorkoutTemplate
Session ?──1 WorkoutTemplate  (nullable template_id)
Session 1──* SessionTarget *──1 Exercise  (snapshot at start)
```

## TypeScript Models

### `src/models/template.ts`

```ts
export interface WorkoutTemplate {
  id: string;
  name: string;
  styleTag: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateExercise {
  id: string;
  templateId: string;
  exerciseId: string;
  ordinal: number;
  targetSets: number;
  targetReps: number;
  targetWeight: number | null;
}

export interface TemplateDetail extends WorkoutTemplate {
  exercises: (TemplateExercise & { exerciseName: string })[];
}
```

### `src/models/program.ts`

```ts
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_NAMES: Record<DayOfWeek, string> = {
  0: 'Monday', 1: 'Tuesday', 2: 'Wednesday',
  3: 'Thursday', 4: 'Friday', 5: 'Saturday', 6: 'Sunday',
};

export interface Program {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramDay {
  id: string;
  programId: string;
  dayOfWeek: DayOfWeek;
  templateId: string;
}

export interface ProgramDetail extends Program {
  days: (ProgramDay & { templateName: string })[];
}
```

### `src/models/session-target.ts`

```ts
export interface SessionTarget {
  id: string;
  sessionId: string;
  exerciseId: string;
  ordinal: number;
  targetSets: number;
  targetReps: number;
  targetWeight: number | null;
}
```

## Schema Migration Strategy

- Migration 002 (`src/db/migrations/002-templates.ts`) creates all
  five new tables and alters `sessions`.
- Registered in `src/db/database.ts` migrations array.
- Backward-compatible: existing sessions have `template_id = NULL`.
- `ON DELETE CASCADE` on template_exercises and program_days ensures
  deleting a template or program cleans up children.
- session_targets CASCADE on session deletion.

## State Transitions

### WorkoutTemplate lifecycle
- Created → saved (name + exercises persisted)
- Saved → edited (name, tag, exercises modified)
- Saved → deleted (CASCADE removes template_exercises)
- Saved → snapshotted (session_targets created on session start)

### Program lifecycle
- Created → saved
- Saved → activated (is_active = 1; all others set to 0)
- Active → deactivated (another program activated, or user toggles)
- Saved → deleted (CASCADE removes program_days)
