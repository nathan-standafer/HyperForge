# Research: Workout Templates & Programs

## Template Snapshot Strategy

**Decision**: Dedicated `session_targets` table that captures the
template's exercise list at session-start time (one row per
exercise in the template). Sessions table gets an optional
`template_id` FK.

**Rationale**: The spec requires that editing a template after
starting a session must not affect the running session (FR-015).
It also requires force-close recovery to restore remaining template
targets (US2-AS6). Storing the snapshot in a relational table
(instead of a JSON blob on sessions) keeps it queryable and follows
the existing SQLite patterns. The session_targets table is write-once
at session start and read-only thereafter.

**Alternatives considered**:
- JSON blob on sessions table: simpler but not queryable; harder to
  validate and evolve.
- No snapshot (read template at render time): violates FR-015 and
  breaks force-close recovery if template was edited between close
  and reopen.
- Separate `session_template_exercises` junction table: functionally
  identical to `session_targets`; renamed for clarity since it
  represents targets, not logged sets.

## Exercise Reorder Approach

**Decision**: Move-up / move-down buttons on each exercise row in the
template editor. No drag-and-drop library.

**Rationale**: The spec says "drag-and-drop or equivalent gesture"
(FR-003). `react-native-draggable-flatlist` requires
`react-native-reanimated` (~600KB) as a peer dependency — a heavy
addition for a single feature. Move-up/move-down achieves the same
result with zero new dependencies, aligning with the Simplicity
principle. Touch targets for move buttons meet the ≥40px minimum
from the constitution.

**Alternatives considered**:
- `react-native-draggable-flatlist` + `react-native-reanimated`:
  polished UX but heavyweight; rejected per Simplicity principle
  for v1. Can upgrade later if user feedback demands it.
- Manual pan responder + Animated: complex to implement correctly,
  fragile across RN versions.

## Training Style Tags

**Decision**: Free-text column on the templates table with a
predefined suggestion list surfaced in the UI. Suggestions: Push,
Pull, Legs, Upper, Lower, Full Body, Custom. No separate tags
table.

**Rationale**: A normalized tags table adds a join and a CRUD surface
for minimal benefit when the tag set is small and user-extensible.
Free-text is simpler, meets FR-016 ("Users may type a custom tag"),
and filtering is a straightforward `WHERE style_tag = ?`.

**Alternatives considered**:
- Normalized tags table with many-to-many: overkill for single
  free-text tag per template.
- Enum column: prevents custom tags, violates FR-016.

## Program Day-of-Week Model

**Decision**: `program_days` table with columns `program_id`,
`day_of_week` (integer 0=Monday through 6=Sunday), and
`template_id`. Unique constraint on `(program_id, day_of_week)`.

**Rationale**: Maps directly to the spec's "assign templates to
specific days of the week" (FR-009). Integer representation aligns
with ISO 8601 (Monday=0) and simplifies comparison with
`new Date().getDay()` after adjustment. Unique constraint enforces
one template per day per program.

**Alternatives considered**:
- 7 nullable template_id columns on the programs table: denormalized
  but rigid; makes queries harder.
- JSON array of assignments on programs table: not queryable.

## "Today's Suggestion" Detection

**Decision**: On home screen load, query the active program's
`program_days` for today's day-of-week. If a template is assigned,
check whether a session with that `template_id` and a start_time
matching today's date already exists. If not, show the suggestion
card. If yes, show a "completed" state.

**Rationale**: Simple, fast (two indexed queries), and deterministic.
"Today" is resolved via `new Date()` which uses the device's local
timezone — matching the spec's assumption.

**Alternatives considered**:
- Background scheduler: overkill for a single daily check.
- Caching the suggestion in AsyncStorage: adds a stale-data problem
  without measurable performance gain.

## Integration With Feature 001 Session Service

**Decision**: Do not modify `createSession()` or `logSet()`. Instead,
create a new `session-template-service.ts` that:
1. Calls `createSession()` to get a new session.
2. Updates the session's `template_id` column.
3. Inserts rows into `session_targets` from the template's exercises.

Existing set-logging flow (SetLogForm, logSet) is unchanged; the
template session view pre-fills form defaults but delegates to the
same `logSet` function.

**Rationale**: Keeps feature 001's write paths untouched, minimizing
regression risk. The new service is additive.

**Alternatives considered**:
- Modifying `createSession()` to accept an optional template:
  tighter coupling; risks breaking existing callers.
- Middleware/wrapper pattern: unnecessarily abstract for one
  integration point.
