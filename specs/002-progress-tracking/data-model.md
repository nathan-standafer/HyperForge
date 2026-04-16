# Data Model: Progress Tracking & Charts

## Storage Changes

**None.** This feature is strictly read-only over the tables defined
in feature 001 (`exercises`, `sessions`, `sets`). No new tables, no
schema migration, no indexes beyond those already created by feature
001 (which include `Set(exerciseId, timestamp DESC)` — exactly the
access pattern used here).

## Derived Entities

The entities below are computed on demand from existing data. They
are returned from services as plain TypeScript objects; they are not
persisted.

### SessionPoint

One point in a per-exercise time series.

| Field            | Type    | Notes                                             |
|------------------|---------|---------------------------------------------------|
| sessionId        | string  | FK → sessions.id                                  |
| date             | string  | ISO 8601 date of session start                    |
| topWeight        | number  | Heaviest weight across that session's sets of this exercise, in preferred unit |
| topWeightReps    | integer | Reps at which `topWeight` was achieved            |
| estimatedOneRm   | number  | Epley applied to the heaviest-1RM set that session |
| totalVolume      | number  | Sum of `weight × reps` across the session's sets of this exercise |
| setCount         | integer | Number of sets of this exercise in the session    |

### ExerciseProgressSeries

| Field     | Type             | Notes                                         |
|-----------|------------------|-----------------------------------------------|
| exerciseId| string           | FK → exercises.id                             |
| unit      | "kg" \| "lb"    | User's current preferred unit                 |
| range     | TimeRange        | Applied filter                                |
| points    | SessionPoint[]   | Chronological ASC by date; may be empty       |

### PersonalRecord

| Field       | Type                                       | Notes                               |
|-------------|--------------------------------------------|-------------------------------------|
| exerciseId  | string                                     | FK → exercises.id                   |
| repRange    | 1 \| 3 \| 5 \| 8 \| 10 \| "1rm"          | 10 = 10+ bucket; "1rm" = all-time Epley max |
| weight      | number                                     | Best-ever weight (preferred unit)   |
| reps        | integer                                    | Exact reps achieved (≥ repRange; for "1rm" this is the reps of the underlying set) |
| achievedOn  | string                                     | ISO 8601 date                       |
| sessionId   | string                                     | FK → sessions.id                    |
| setId       | string                                     | FK → sets.id                        |

### DashboardSummary

| Field              | Type                 | Notes                                      |
|--------------------|----------------------|--------------------------------------------|
| range              | TimeRange            | Applied filter                             |
| workoutCount       | integer              | Completed sessions in range                |
| totalVolume        | number               | Sum of `weight × reps` for all sets in range (preferred unit) |
| workoutsPerWeek    | number               | `workoutCount / weeksInRange`, rounded to 1 decimal |
| currentStreakWeeks | integer              | Consecutive ISO weeks (Mon–Sun) ending this week with ≥1 session, breaks on first empty week scanning backward |
| recentPRs          | PersonalRecord[]     | PRs whose `achievedOn` falls within range, newest first |

### TimeRange

Enum: `'4w' | '3m' | '6m' | '1y' | 'all'`.
Resolved to a date window by `resolveRange(range, now)`:

| Value | Window                                  |
|-------|-----------------------------------------|
| `4w`  | `[now − 4 calendar weeks, now]`         |
| `3m`  | `[now − 3 calendar months, now]`        |
| `6m`  | `[now − 6 calendar months, now]`        |
| `1y`  | `[now − 1 calendar year, now]`          |
| `all` | `[epoch (1970-01-01), now]`             |

## Computation Rules

- **Top weight of a session** (per exercise): `MAX(weight)` across
  the session's sets of that exercise. Ties on weight are broken by
  higher reps.
- **Estimated 1RM of a session** (per exercise): take each set,
  compute `weight × (1 + reps / 30)`, return the max. For `weight = 0`
  (bodyweight), estimated 1RM is null.
- **Total volume**: `Σ (weight × reps)` across all included sets.
  Bodyweight sets with `weight = 0` contribute 0 and are omitted
  from weight-based charts but counted in rep/volume stats.
- **PR rep buckets**:
  - Reps = 1 → 1RM bucket
  - Reps = 3 → 3RM bucket
  - Reps = 5 → 5RM bucket
  - Reps = 8 → 8RM bucket
  - Reps ≥ 10 → 10+ bucket (best weight regardless of exact rep count)
  - All sets → "1rm" synthetic bucket via Epley (highest wins)
- **Streak**: walk backward from the current ISO week, counting
  consecutive weeks each with ≥1 session whose `endTime` falls in
  that week. Stop at the first week with zero sessions.

## Relationships (Logical)

```text
Exercise ──* Set *── Session
                   │
                   ├─▶ SessionPoint  (per (exercise, session) in range)
                   ├─▶ PersonalRecord (per (exercise, repRange))
                   └─▶ DashboardSummary (per range, cross-exercise)
```

## Validation

- `range` MUST be one of the five TimeRange values.
- Services MUST return an empty-but-well-formed result for exercises
  or ranges with no underlying data — never throw, never return null.
- Bodyweight sets (`weight = 0`) MUST NOT appear in weight trend
  charts or contribute to weight PRs; they MAY appear in volume and
  rep-count displays.
- Deleted or edited sets MUST be reflected on the next view render;
  no cached derived state persists across renders.
