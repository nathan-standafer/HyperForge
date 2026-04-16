# Feature Specification: Progress Tracking & Charts

**Feature Branch**: `002-progress-tracking`
**Created**: 2026-04-15
**Status**: Draft
**Input**: User description: "Progress tracking and charts: visualize training progress over time using logged workout data. Show per-exercise trends for weight, estimated 1RM, and total volume across sessions. Highlight personal records (PRs) and recent milestones. Provide a dashboard summarizing recent workouts (volume, frequency, streaks) and per-exercise detail views with time-series charts. Users should be able to filter by exercise and time range (last 4 weeks, 3 months, 6 months, 1 year, all time). Must work offline against the locally logged data from the workout-logging feature."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Per-Exercise Trend Over Time (Priority: P1)

As a lifter who has been logging workouts, I want to open an exercise
(e.g., Back Squat) and see how my top weight, estimated 1-rep max,
and total volume have changed over time, so I can tell whether I'm
actually getting stronger.

**Why this priority**: This is the single most valuable use of the
data already being logged. Without it, the logging feature produces
data that the user cannot easily interpret. Delivering this one story
alone turns HyperForge from a logbook into a progress tool.

**Independent Test**: With at least two prior sessions containing the
same exercise, open that exercise from the progress view, and verify
a time-series chart renders showing weight, estimated 1RM, and volume
per session in chronological order.

**Acceptance Scenarios**:

1. **Given** the user has logged an exercise across multiple
   sessions, **When** they open that exercise in the progress view,
   **Then** a time-series chart displays top weight, estimated 1RM,
   and total volume with one data point per session.
2. **Given** the user is viewing an exercise's trend, **When** they
   change the time range filter (4 weeks / 3 months / 6 months /
   1 year / all time), **Then** the chart re-renders to show only
   sessions inside the selected range.
3. **Given** the user taps a point on the chart, **When** the point
   is selected, **Then** the session date, weight, reps, and
   estimated 1RM for that session are shown.
4. **Given** the user has logged the exercise only once, **When**
   they open its progress view, **Then** a single data point is shown
   with a message indicating more sessions are needed for a trend.
5. **Given** the device is offline, **When** the user opens the
   progress view, **Then** all charts render from locally stored
   data with no network request required.

---

### User Story 2 - Dashboard of Recent Activity (Priority: P2)

As a lifter, I want a dashboard that summarizes my recent training —
how many workouts I did, how much total volume I moved, my current
streak, and any new personal records — so I can see momentum at a
glance without drilling into individual exercises.

**Why this priority**: The dashboard creates a daily/weekly reason to
open the app even on non-training days and surfaces accomplishments
that individual exercise views hide. It depends on the same
underlying data as P1 but is not required for P1 to deliver value.

**Independent Test**: With logged sessions across the last 4 weeks,
open the dashboard and verify it shows workout count, total volume,
current streak, and a list of recent PRs for the selected time range.

**Acceptance Scenarios**:

1. **Given** the user has logged workouts in the last 4 weeks,
   **When** they open the dashboard, **Then** it shows workout count,
   total volume moved, training frequency (workouts per week), and
   current consecutive-week streak.
2. **Given** a logged set exceeds any previous top weight or
   estimated 1RM for that exercise, **When** the dashboard is opened,
   **Then** that set is listed in a "Recent PRs" section with
   exercise name, value, and date.
3. **Given** the user changes the dashboard time range, **When** the
   range changes, **Then** all summary metrics recompute for that
   range.
4. **Given** the user has no logged sessions, **When** they open the
   dashboard, **Then** an empty-state message invites them to log
   their first workout instead of showing zeroed metrics.

---

### User Story 3 - Personal Record History Per Exercise (Priority: P3)

As a lifter, I want to see a list of every personal record I have
ever set for an exercise — heaviest weight for various rep ranges and
highest estimated 1RM — so I can set concrete goals to beat.

**Why this priority**: PR history deepens engagement but is derivable
from the same data that powers P1 and P2. Users get value from P1 and
P2 before this ships.

**Independent Test**: Open an exercise with multiple past sessions
and verify a PR list shows, for each rep range (1, 3, 5, 8, 10+), the
heaviest weight ever recorded and the date it was achieved.

**Acceptance Scenarios**:

1. **Given** the user has multiple sessions for an exercise, **When**
   they open that exercise's PR history, **Then** the heaviest weight
   for each standard rep range and the all-time estimated 1RM are
   listed with the date achieved.
2. **Given** a new set beats an existing PR, **When** the set is
   logged, **Then** the PR list reflects the new record on next
   view.

---

### Edge Cases

- **No data**: Exercise or dashboard opened with zero logged sets
  must show a clear empty state, not a broken chart.
- **Single data point**: Trend views must render gracefully with one
  session (no line, just the point and a hint).
- **Unit changes**: If the user switches between kg and lb between
  sessions, historical values must be displayed consistently in the
  user's current preferred unit.
- **Bodyweight exercises**: Exercises logged without external weight
  must display rep count and volume trends instead of weight.
- **Deleted sessions**: If a session is deleted, progress views and
  PR lists must recompute without stale data.
- **Future-dated data**: Sessions with clock-skewed timestamps must
  not break the time range filters.
- **Large history**: Users with years of data must still be able to
  open the "all time" view without noticeable lag.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST compute, for each exercise, a
  per-session series containing the date, heaviest weight lifted,
  estimated 1-rep max, and total volume (sum of weight × reps).
- **FR-002**: The system MUST render a time-series chart of the
  per-session series for a selected exercise, with weight, estimated
  1RM, and volume each individually viewable.
- **FR-003**: Users MUST be able to filter any progress view by one
  of five time ranges: last 4 weeks, 3 months, 6 months, 1 year, all
  time.
- **FR-004**: The system MUST identify and display personal records
  per exercise, including heaviest weight per standard rep range
  (1, 3, 5, 8, 10+) and all-time highest estimated 1RM, with the
  date achieved.
- **FR-005**: The system MUST provide a dashboard that summarizes,
  for the selected time range: workout count, total volume, training
  frequency (workouts per week), current consecutive-week streak,
  and recent personal records.
- **FR-006**: The system MUST operate fully offline: all progress
  views, charts, PRs, and dashboard metrics MUST be derivable from
  locally stored workout data with no network dependency.
- **FR-007**: The system MUST recompute progress views, PRs, and
  dashboard metrics automatically when underlying workout data
  changes (new set logged, session deleted, set edited).
- **FR-008**: The system MUST present data in the user's current
  preferred unit (kg or lb), converting stored values as needed so
  that trends are consistent across the full history.
- **FR-009**: The system MUST show empty states — not zeros or
  broken charts — when insufficient data exists for a view.
- **FR-010**: The system MUST let users tap a chart point to see
  the detail of the underlying session (date, weight, reps,
  estimated 1RM).
- **FR-011**: The system MUST estimate 1-rep max using a standard,
  widely-recognized formula (e.g., Epley) applied to the heaviest
  set of each session.
- **FR-012**: The system MUST render progress views within a user-
  perceptible instant for histories up to at least one year.

### Key Entities

- **ExerciseProgressSeries**: A chronologically ordered set of
  per-session summary points for one exercise, each point holding
  date, heaviest weight, estimated 1RM, and total volume. Derived
  from logged sessions; not independently persisted.
- **PersonalRecord**: A best-ever value for an exercise within a
  specific rep range or for all-time estimated 1RM, including the
  date and session it was achieved in.
- **DashboardSummary**: Aggregate metrics for a selected time range —
  workout count, total volume, training frequency, current streak,
  and a list of recent PRs. Derived on demand.
- **TimeRangeFilter**: The user's currently selected window (4 weeks,
  3 months, 6 months, 1 year, all time) that scopes every progress
  view.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with existing logged data can open the progress
  view for any exercise and see their trend in under 2 seconds from
  app launch.
- **SC-002**: Changing the time range filter updates all visible
  charts and metrics in under 500 milliseconds for histories of up
  to one year.
- **SC-003**: 95% of users surveyed can correctly identify whether
  their top weight on a given exercise has increased or decreased
  over the last 3 months using only the progress view.
- **SC-004**: Personal records are detected with 100% accuracy
  relative to the logged data — no missed PRs and no false PRs —
  verified on a fixed test dataset.
- **SC-005**: All progress views function with the device in
  airplane mode, verified end-to-end for every chart, dashboard
  metric, and PR list.
- **SC-006**: Dashboard streak, volume, and workout count match
  hand-calculated values from the raw logs for a reference dataset
  of at least 12 weeks.

## Assumptions

- Workout logging (feature 001) is the sole source of session and
  set data; this feature reads that data and does not modify it.
- Users have logged at least a few sessions before opening progress
  views; empty states handle the zero-data case but are not the
  primary path.
- Estimated 1RM uses the Epley formula (weight × (1 + reps / 30))
  as a reasonable default; this is a widely-used convention and
  does not require user configuration for v1.
- Standard rep ranges for PRs are 1, 3, 5, 8, and 10+; custom rep
  ranges are out of scope for v1.
- "Current streak" means consecutive calendar weeks with at least
  one logged workout, counting back from the current week.
- Sharing, exporting, and printing of progress data are out of scope
  for v1.
- Multi-device sync of progress data is out of scope for v1; each
  device computes progress from its local logs.
- Bodyweight-only exercises display rep and volume trends; weight
  trend is omitted for those exercises.
- Injury/deload annotations, goal-setting, and coach-style
  recommendations are out of scope for v1.
