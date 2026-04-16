# Contract: Progress Services

This feature exposes three internal TypeScript service modules and a
small shared library. No network API, no CLI — the "interface" is
the function signatures consumed by the UI layer.

## `src/lib/one-rm.ts`

```ts
/** Epley 1RM estimate. Returns null for weight <= 0. */
export function estimateOneRm(weight: number, reps: number): number | null;
```

Rules:
- `weight <= 0` → `null` (bodyweight exercises have no weight 1RM).
- `reps < 1` → `null`.
- Otherwise returns `weight * (1 + reps / 30)`, rounded to 2 decimals.

## `src/lib/time-range.ts`

```ts
export type TimeRange = '4w' | '3m' | '6m' | '1y' | 'all';

export interface DateWindow { start: Date; end: Date; }

/** Resolves a TimeRange to an absolute [start, end] window. */
export function resolveRange(range: TimeRange, now?: Date): DateWindow;

/** ISO week (Mon–Sun) that contains the given date. */
export function isoWeekOf(date: Date): { start: Date; end: Date };
```

## `src/services/progress-service.ts`

```ts
import type { TimeRange } from '../lib/time-range';

export interface SessionPoint {
  sessionId: string;
  date: string;             // ISO 8601
  topWeight: number;
  topWeightReps: number;
  estimatedOneRm: number | null;
  totalVolume: number;
  setCount: number;
}

export interface ExerciseProgressSeries {
  exerciseId: string;
  unit: 'kg' | 'lb';
  range: TimeRange;
  points: SessionPoint[];   // chronological ASC
}

/**
 * Returns the per-session series for one exercise within the range.
 * Empty `points` array if no sets exist. Never throws.
 */
export function getExerciseProgress(
  exerciseId: string,
  range: TimeRange,
): Promise<ExerciseProgressSeries>;
```

## `src/services/pr-service.ts`

```ts
export type PrRepRange = 1 | 3 | 5 | 8 | 10 | '1rm';

export interface PersonalRecord {
  exerciseId: string;
  repRange: PrRepRange;
  weight: number;
  reps: number;
  achievedOn: string;       // ISO 8601 date
  sessionId: string;
  setId: string;
}

/** All-time PRs for one exercise across every rep bucket. */
export function getExercisePrs(exerciseId: string): Promise<PersonalRecord[]>;

/**
 * PRs whose achievedOn falls within the range, newest first.
 * Used by the dashboard "Recent PRs" section.
 */
export function getRecentPrs(
  range: import('../lib/time-range').TimeRange,
): Promise<PersonalRecord[]>;
```

## `src/services/dashboard-service.ts`

```ts
import type { TimeRange } from '../lib/time-range';
import type { PersonalRecord } from './pr-service';

export interface DashboardSummary {
  range: TimeRange;
  workoutCount: number;
  totalVolume: number;
  workoutsPerWeek: number;
  currentStreakWeeks: number;
  recentPRs: PersonalRecord[];
}

export function getDashboardSummary(
  range: TimeRange,
): Promise<DashboardSummary>;
```

## Invariants (apply to all services)

1. **Offline**: services MUST NOT make network requests.
2. **Read-only**: services MUST NOT write to the database.
3. **Empty safety**: zero-data inputs return well-formed empty
   results (`points: []`, `recentPRs: []`, `workoutCount: 0`, etc.).
4. **Unit**: all numeric weight/volume fields are in the user's
   current preferred unit; conversion happens inside the service.
5. **Determinism**: given the same database state and range, results
   MUST be identical across calls (no random ordering, no time-based
   jitter beyond the explicit `now` parameter).

## Component UI Contracts

### `TrendChart`
Props: `{ points: SessionPoint[]; metric: 'weight' | '1rm' | 'volume'; unit: 'kg'|'lb'; onPointPress?: (p: SessionPoint) => void }`
Behavior: renders a time-series line + scatter for the chosen metric;
empty state when `points.length === 0`; single point rendered as a
scatter dot with no line.

### `TimeRangeFilter`
Props: `{ value: TimeRange; onChange: (r: TimeRange) => void }`
Behavior: five chips (`4w`, `3m`, `6m`, `1y`, `All`) with the current
value highlighted; single-tap selects.

### `DashboardSummary` (component)
Props: `{ summary: DashboardSummary }`
Behavior: renders four metric cards + the recent-PR list; empty state
when `workoutCount === 0`.
