# Feature Specification: Workout Logging

**Feature Branch**: `001-workout-logging`
**Created**: 2026-04-15
**Status**: Draft
**Input**: User description: "Core set/rep/weight logging during a gym session"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Log a Set During a Workout (Priority: P1)

As a lifter mid-workout, I want to quickly record the exercise I just
performed — including the exercise name, weight, reps, and how hard it
felt — so that my training data is captured before I forget it.

**Why this priority**: This is the foundational action of the entire
app. Without set logging, no other feature (progress tracking, charts,
recommendations) can function. It also validates the mobile-first,
≤3-tap-per-set principle from the constitution.

**Independent Test**: Open the app on a phone, select an exercise,
enter weight and reps, tap "Log", and verify the set appears in the
current session.

**Acceptance Scenarios**:

1. **Given** the user has started a workout session, **When** they
   select an exercise and enter weight (e.g., 80 kg) and reps (e.g.,
   10), **Then** the set is saved and immediately visible in the
   session view.
2. **Given** the user is logging a set, **When** they tap the log
   button, **Then** the set is persisted locally within 1 second and
   confirmed with visual feedback.
3. **Given** the user performed the same exercise last session,
   **When** they select that exercise, **Then** the previous session's
   weight and reps are pre-filled as defaults.
4. **Given** the user is offline, **When** they log a set, **Then**
   the set is stored locally and synced when connectivity resumes.

---

### User Story 2 - Manage a Workout Session (Priority: P2)

As a lifter, I want to start, continue, and finish a workout session
so that my sets are grouped by date and I can review an entire
workout as a coherent unit.

**Why this priority**: Sessions provide the organizational structure
that makes logged sets meaningful. Without sessions, sets are an
unordered list with no temporal context.

**Independent Test**: Start a new session, log several sets across
different exercises, end the session, and verify all sets appear
grouped under that session with correct timestamps.

**Acceptance Scenarios**:

1. **Given** the user opens the app with no active session, **When**
   they tap "Start Workout", **Then** a new session is created with
   the current date and time.
2. **Given** the user has an active session, **When** they log
   multiple sets for different exercises, **Then** all sets are
   associated with the current session.
3. **Given** the user has an active session, **When** they tap "End
   Workout", **Then** the session is marked complete with a summary
   (total sets, total volume, duration).
4. **Given** the user force-closes the app during a session, **When**
   they reopen it, **Then** the active session is restored with all
   previously logged sets intact.

---

### User Story 3 - Review Past Workouts (Priority: P3)

As a lifter, I want to browse my past workout sessions so I can see
what I did previously and plan my next workout accordingly.

**Why this priority**: Reviewing history supports progressive
overload decisions, but the app delivers value even without this
feature (users can still log).

**Independent Test**: After completing several sessions over multiple
days, open the history view and verify sessions are listed
chronologically with correct set details.

**Acceptance Scenarios**:

1. **Given** the user has completed at least one session, **When**
   they navigate to workout history, **Then** sessions are listed in
   reverse chronological order showing date, duration, and exercise
   count.
2. **Given** the user taps a past session, **When** the detail view
   opens, **Then** all sets for that session are displayed grouped by
   exercise with weight, reps, and RIR for each set.

---

### Edge Cases

- What happens when the user logs a set with zero weight (bodyweight
  exercise)? The system accepts it and labels the set as bodyweight.
- What happens when the user accidentally logs a set with wrong data?
  The user can edit or delete any set within the current session.
- What happens when the app crashes mid-set-entry? Unsaved form data
  is lost, but all previously logged sets in the session are preserved.
- What happens when the user starts a new session while one is still
  active? The app prompts the user to end the current session first.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create, continue, and end
  workout sessions.
- **FR-002**: System MUST allow users to log a set by selecting an
  exercise and entering weight and reps.
- **FR-003**: System MUST persist each logged set to local storage
  before displaying confirmation to the user.
- **FR-004**: System MUST pre-fill weight and reps from the user's
  most recent session for the same exercise.
- **FR-005**: System MUST allow users to edit or delete any set
  within the current active session.
- **FR-006**: System MUST restore an active session and its sets if
  the app is closed and reopened.
- **FR-007**: System MUST record a timestamp for each logged set.
- **FR-008**: System MUST display a session summary (total sets,
  total volume in kg/lb, duration) when a session ends.
- **FR-009**: System MUST allow users to browse past sessions in
  reverse chronological order.
- **FR-010**: System MUST support an optional RIR (Reps in Reserve)
  field per set to capture perceived effort.
- **FR-011**: System MUST function fully offline, storing all data
  locally, and sync when connectivity returns.

### Key Entities

- **Exercise**: A named movement pattern (e.g., "Barbell Bench Press")
  with associated muscle group(s). For this feature, a minimal
  built-in list is sufficient; a full exercise library is out of scope.
- **Set**: A single performance record — belongs to one exercise
  within one session. Attributes: weight, reps, RIR (optional),
  timestamp.
- **Session**: A time-bounded workout event grouping one or more sets.
  Attributes: start time, end time, status (active/complete).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can log a set in 3 taps or fewer from the active
  session screen.
- **SC-002**: 95% of users can complete their first set log without
  external help or instructions.
- **SC-003**: No logged set is ever silently lost — data persists
  across app restarts, crashes, and connectivity changes.
- **SC-004**: Set logging works entirely offline with no degradation
  in functionality.
- **SC-005**: Users can review any past session and see complete set
  details within 2 seconds of navigation.

## Assumptions

- Users have a smartphone (iOS or Android) as their primary device
  during workouts.
- A minimal, hardcoded list of common exercises (e.g., 20-30
  exercises covering major muscle groups) is sufficient for v1; a
  full searchable exercise library will be a separate feature.
- Weight units default to the user's locale preference (kg or lb)
  and can be toggled in settings; unit conversion is out of scope
  for this feature.
- User accounts and authentication are out of scope for this feature;
  data is stored locally on-device.
- Sync/backup to a remote server is out of scope for this feature
  beyond ensuring the local storage architecture supports future sync.
