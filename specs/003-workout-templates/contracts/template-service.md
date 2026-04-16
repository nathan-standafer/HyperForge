# Contract: Template & Program Services

## `src/services/template-service.ts`

```ts
import type { WorkoutTemplate, TemplateExercise, TemplateDetail } from '../models/template';

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
  styleTag?: string;
}

/** Create a template with its exercises in a single transaction. */
export function createTemplate(input: CreateTemplateInput): Promise<TemplateDetail>;

/** List all templates, optionally filtered by training style tag. */
export function listTemplates(styleTag?: string): Promise<WorkoutTemplate[]>;

/** Full template with exercise list and exercise names. */
export function getTemplateDetail(templateId: string): Promise<TemplateDetail>;

/** Update template metadata (name, tag). */
export function updateTemplate(templateId: string, input: UpdateTemplateInput): Promise<WorkoutTemplate>;

/** Delete template and all its exercises (CASCADE). */
export function deleteTemplate(templateId: string): Promise<void>;

/** Add an exercise to a template at a given position. */
export function addTemplateExercise(
  templateId: string,
  exerciseId: string,
  targetSets: number,
  targetReps: number,
  targetWeight?: number,
): Promise<TemplateExercise>;

/** Remove an exercise from a template. Renumbers ordinals. */
export function removeTemplateExercise(templateExerciseId: string): Promise<void>;

/** Move an exercise up or down within a template. */
export function moveTemplateExercise(
  templateExerciseId: string,
  direction: 'up' | 'down',
): Promise<void>;

/** Update target values on a single template exercise. */
export function updateTemplateExercise(
  templateExerciseId: string,
  input: { targetSets?: number; targetReps?: number; targetWeight?: number | null },
): Promise<TemplateExercise>;
```

**Invariants**:
1. `createTemplate` assigns ordinals 0..N-1 based on array order.
2. All multi-row mutations (create template + exercises, reorder)
   run inside a transaction.
3. `deleteTemplate` relies on `ON DELETE CASCADE` for cleanup.
4. `listTemplates` returns alphabetically by name.

## `src/services/program-service.ts`

```ts
import type { Program, ProgramDay, ProgramDetail, DayOfWeek } from '../models/program';
import type { TemplateDetail } from '../models/template';

export interface CreateProgramInput {
  name: string;
  days: { dayOfWeek: DayOfWeek; templateId: string }[];
}

/** Create a program with its day assignments. */
export function createProgram(input: CreateProgramInput): Promise<ProgramDetail>;

/** List all programs. */
export function listPrograms(): Promise<Program[]>;

/** Full program with day assignments and template names. */
export function getProgramDetail(programId: string): Promise<ProgramDetail>;

/** Delete a program (CASCADE removes days). */
export function deleteProgram(programId: string): Promise<void>;

/** Set a program as the active program (deactivates all others). */
export function setActiveProgram(programId: string): Promise<void>;

/** Clear the active program (no program is active). */
export function clearActiveProgram(): Promise<void>;

/** Assign or replace a template for a given day in a program. */
export function assignDay(
  programId: string,
  dayOfWeek: DayOfWeek,
  templateId: string,
): Promise<ProgramDay>;

/** Remove a day assignment from a program. */
export function unassignDay(programId: string, dayOfWeek: DayOfWeek): Promise<void>;

/** Get today's suggestion: the template assigned to today in the
 *  active program (if any), plus whether a session for it already
 *  exists today. Returns null if no active program or no assignment
 *  for today. */
export interface TodaySuggestion {
  template: TemplateDetail;
  alreadyCompleted: boolean;
}
export function getTodaySuggestion(): Promise<TodaySuggestion | null>;
```

**Invariants**:
1. `setActiveProgram` deactivates all programs then activates the
   target, in a single transaction.
2. `getTodaySuggestion` uses `new Date()` for "today" (device
   local timezone).
3. "Already completed" = a session with `template_id = X` AND
   `start_time` on today's date exists.

## `src/services/session-template-service.ts`

```ts
import type { Session } from '../models/session';
import type { SessionTarget } from '../models/session-target';

/**
 * Start a session from a template:
 * 1. Call createSession() (from session-service).
 * 2. Set session.template_id.
 * 3. Copy template exercises → session_targets (snapshot).
 * Returns the new session + its targets.
 */
export function startSessionFromTemplate(
  templateId: string,
): Promise<{ session: Session; targets: SessionTarget[] }>;

/** Get the session's template targets (for restoring UI state). */
export function getSessionTargets(
  sessionId: string,
): Promise<SessionTarget[]>;
```

**Invariants**:
1. `startSessionFromTemplate` runs in a transaction.
2. If the template has exercises referencing deleted exercises,
   those entries are skipped and a warning is returned.
3. After this function, the session is active and logged sets
   flow through the existing `logSet()` path.

## Component UI Contracts

### `TemplateCard`
Props: `{ template: WorkoutTemplate; exerciseCount: number; onPress: () => void }`
Renders: name, style tag chip, exercise count. Tap navigates to detail.

### `TemplateForm`
Props: `{ initial?: TemplateDetail; onSave: (input: CreateTemplateInput) => void; onCancel: () => void }`
Renders: name field, style tag selector (predefined + custom),
exercise list with `TemplateExerciseRow` components.

### `TemplateExerciseRow`
Props: `{ exercise: TemplateExercise & { exerciseName: string }; isFirst: boolean; isLast: boolean; onMoveUp: () => void; onMoveDown: () => void; onRemove: () => void; onEdit: (input) => void }`
Renders: exercise name, target sets × reps @ weight, move-up/move-down
buttons (disabled at boundaries), remove button.

### `SuggestionCard`
Props: `{ suggestion: TodaySuggestion; onStart: () => void }`
Renders: template name, exercise count, "Start Workout" button if
not completed, "Completed" badge if done.

### `TemplateSessionView`
Props: `{ targets: SessionTarget[]; loggedSets: Set[]; exercises: Map<string, Exercise>; onLogSet: (exerciseId, weight, reps) => void }`
Renders: per-exercise target rows showing progress (e.g., "2/3 sets
done"), pre-filled weight/reps for the next set, tap to log.
