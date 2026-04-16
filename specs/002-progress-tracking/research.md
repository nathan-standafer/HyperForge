# Research: Progress Tracking & Charts

## 1RM Estimation Formula

**Decision**: Epley formula — `1RM = weight × (1 + reps / 30)`.
Applied to the heaviest set of each session for each exercise.

**Rationale**: Epley is the most widely-cited submaximal 1RM estimator
in strength training; accurate within a few percent for 1–10 rep
ranges which cover the vast majority of hypertrophy/strength work.
Simple closed-form expression — no branching, trivially unit-tested.

**Alternatives considered**:
- Brzycki (`weight × 36 / (37 - reps)`): similar accuracy, slightly
  less stable above 10 reps.
- Lombardi (`weight × reps^0.10`): less common, harder to explain.
- User-selectable formula: rejected as premature configuration (YAGNI;
  per Simplicity principle).

## Charting Library

**Decision**: `victory-native` with `react-native-svg`.

**Rationale**: Mature, actively-maintained, first-class Expo support,
composable primitives (`VictoryLine`, `VictoryScatter`, `VictoryAxis`),
small bundle relative to alternatives, declarative React API that
matches our existing component style.

**Alternatives considered**:
- `react-native-chart-kit`: simpler but less flexible for multi-series
  overlays and interaction.
- `react-native-svg-charts`: unmaintained since 2021.
- `Skia`-based charts (`@shopify/react-native-skia`): highest
  performance but significantly more code to get basic time-series
  working — overkill for v1 data volumes.

## Time Range Resolution

**Decision**: A single `resolveRange(range: TimeRange, now: Date)`
function that returns `{ start: Date, end: Date }`. `TimeRange` is
`'4w' | '3m' | '6m' | '1y' | 'all'`. `'all'` returns
`start = new Date(0)`.

**Rationale**: Pure function, trivially testable, used by every
service and component. Keeps range math out of SQL and out of UI.

**Alternatives considered**:
- Computing ranges inline at each call site: rejected — duplication
  and inconsistent edge-case handling.

## Personal Record Detection

**Decision**: Compute PRs on demand by scanning sets for a given
exercise. For each standard rep range (1, 3, 5, 8, 10+), track the
heaviest weight observed at that exact rep count (or any count ≥10
for the 10+ bucket). Also track the all-time highest Epley 1RM. A
"recent PR" for the dashboard is any PR whose achievement date falls
inside the selected time range.

**Rationale**: At expected data volumes (single user, hundreds to low
thousands of sets over years), a single pass over sets per exercise
is sub-millisecond. No need for a dedicated PR table or incremental
maintenance — avoids cache-invalidation bugs. Aligns with Simplicity
principle.

**Alternatives considered**:
- Persisted `personal_records` table updated on every set insert:
  rejected for v1 — adds write-path complexity and a cache-coherency
  concern when sets are edited or deleted, which the constitution's
  Data Integrity principle calls out as a risk.
- Indexed materialized view: overkill for single-user local data.

## Unit Handling

**Decision**: Reuse the existing user unit preference from feature
001. Values in SQLite are stored in their as-entered unit alongside
the unit marker (existing behavior). The progress layer converts all
values to the user's current preferred unit at display time via a
single `toPreferredUnit(value, storedUnit)` helper.

**Rationale**: Keeps display-unit concerns in one place; trends
remain consistent even if the user toggles preference mid-history.

**Alternatives considered**:
- Normalizing on write to a canonical unit: rejected — would require
  a migration and touches feature 001's write path, violating this
  feature's read-only constraint.

## Streak Definition

**Decision**: "Current streak" = consecutive ISO weeks (Monday–Sunday)
ending with the current week, each containing at least one completed
session. Breaks on the first empty week scanning backward.

**Rationale**: Weekly granularity matches the constitution's "weekly
muscle-group progress" framing and is more forgiving than daily for
recreational lifters.

**Alternatives considered**:
- Daily streak: too punishing for 3-5 day/week training schedules.
- Rolling 7-day streak: harder to explain than calendar weeks.

## Empty-State & Single-Point Handling

**Decision**: Every chart and metric renders an explicit empty state
when the underlying dataset has zero sets in range. Single-data-point
series render the point with no connecting line and a hint to log
more workouts. Filter changes that empty the range show the empty
state rather than a blank chart.

**Rationale**: Matches the spec's edge cases and the Visual Feedback
principle — the user should never see an ambiguous blank view.

## Performance Budget

**Decision**: All progress computations target <500ms on a mid-range
2023 Android phone with one year of data (≈ 150 sessions, ≈ 2000
sets). Strategy: single SQL read per view (`SELECT * FROM sets JOIN
exercises ... WHERE date >= ? AND date <= ?`), then in-memory
aggregation.

**Rationale**: Data volumes at single-user scale are tiny; a round
trip to SQLite plus a linear pass is well within budget. Avoids any
premature caching layer.

**Alternatives considered**:
- Precomputed per-session summary table: adds write-path complexity
  and recomputation on edits; deferred until real-world profiling
  shows a need.
