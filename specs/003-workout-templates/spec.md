# Feature Specification: Workout Templates & Programs

**Feature Branch**: `003-workout-templates`
**Created**: 2026-04-15
**Status**: Draft
**Input**: User description: "Workout templates and programs: users can create, edit, and delete reusable workout templates that define a sequence of exercises with target sets, reps, and optional weight suggestions. Users can start a workout session from a template, which pre-loads the exercises and targets into the session so they only need to confirm or adjust each set rather than selecting exercises from scratch. Templates can be organized by training style (push/pull/legs, upper/lower, full body, etc.). Users can also create multi-day programs that group templates into a weekly schedule (e.g., PPL 6-day split). When following a program, the app suggests which template to use today based on the schedule. Must work offline against local data."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Manage a Workout Template (Priority: P1)

As a lifter who repeats the same workouts weekly, I want to create a
template that defines which exercises to do, in what order, with
target sets, reps, and optional weight, so that I can reuse it
without reconfiguring every session from scratch.

**Why this priority**: Templates are the foundational building block.
Without the ability to create and manage templates, none of the other
stories (starting from a template, programs, daily suggestions) can
function.

**Independent Test**: Create a new template named "Push Day", add
three exercises (bench press, overhead press, tricep dip) each with
target sets/reps/weight, save it, view it in the templates list,
edit it to reorder exercises, and delete it.

**Acceptance Scenarios**:

1. **Given** the user has no templates, **When** they tap "Create
   Template", **Then** they see a form to name the template, select a
   training style tag, and add exercises with target sets, reps, and
   optional weight.
2. **Given** the user is building a template, **When** they add an
   exercise, **Then** they can specify target number of sets (e.g.,
   3), target reps (e.g., 10), and an optional target weight.
3. **Given** the user has added multiple exercises to a template,
   **When** they long-press and drag an exercise, **Then** the
   exercise order is updated and persisted.
4. **Given** the user has saved a template, **When** they view the
   templates list, **Then** the template appears with its name,
   training style tag, and exercise count.
5. **Given** the user taps a saved template, **When** the detail
   view opens, **Then** they see all exercises with their targets
   and can edit or delete the template.
6. **Given** the user is offline, **When** they create, edit, or
   delete a template, **Then** the change is persisted locally
   without error.

---

### User Story 2 - Start a Session From a Template (Priority: P2)

As a lifter arriving at the gym, I want to pick a template and
immediately start a workout session with all exercises and targets
pre-loaded, so I can begin logging sets with minimal setup.

**Why this priority**: This is the primary payoff of creating
templates — turning a multi-step exercise selection process into a
single tap. It delivers the most visible time savings and validates
the template concept end-to-end.

**Independent Test**: Open a saved template, tap "Start Workout",
verify a new session is created with all template exercises listed
and target sets/reps/weights pre-filled. Log a set by confirming
the pre-filled values. Verify the set is saved to the session as
in feature 001.

**Acceptance Scenarios**:

1. **Given** the user has a saved template, **When** they tap "Start
   Workout" from the template, **Then** a new session is created and
   all template exercises are listed in template order with their
   target sets, reps, and weight pre-filled.
2. **Given** a template-started session is active, **When** the user
   taps a set row, **Then** the set is logged with the pre-filled
   values (weight, reps) unless the user edits them first.
3. **Given** a template-started session is active, **When** the user
   adjusts the weight or reps on a pre-filled set before logging,
   **Then** the adjusted values are what gets recorded.
4. **Given** a template-started session is active, **When** the user
   wants to add an exercise not in the template, **Then** they can
   add it via the existing exercise picker without disrupting the
   template exercises.
5. **Given** a template-started session is active, **When** the user
   completes fewer or more sets than the template target for an
   exercise, **Then** the session records only the sets actually
   logged (targets are suggestions, not requirements).
6. **Given** a template-started session is active and the app is
   force-closed, **When** the user reopens the app, **Then** the
   session is restored with all logged sets and remaining template
   targets intact.

---

### User Story 3 - Create and Follow a Program (Priority: P3)

As a lifter following a structured training plan (e.g., push/pull/legs
6-day split), I want to create a program that assigns templates to
specific days of the week, and have the app suggest today's workout,
so I stay on track without remembering my schedule.

**Why this priority**: Programs add a scheduling layer on top of
templates. They enhance the template experience but are not required
for templates to deliver value. Users can manually choose templates
without a program.

**Independent Test**: Create a program with three templates assigned
to Monday/Wednesday/Friday. Open the app on a Monday and verify it
suggests the correct template. Start the suggested workout. Open the
app on a Tuesday and verify it shows a rest day or no suggestion.

**Acceptance Scenarios**:

1. **Given** the user has at least two templates, **When** they
   create a new program, **Then** they can name it and assign
   templates to specific days of the week (Monday through Sunday).
2. **Given** a day has a template assigned, **When** the user assigns
   a different template to the same day, **Then** the previous
   assignment is replaced.
3. **Given** the user has an active program, **When** they open the
   app on a day with an assigned template, **Then** the home screen
   shows a suggestion card with the template name, exercise count,
   and a "Start Workout" button.
4. **Given** the user has an active program, **When** they open the
   app on a day with no assigned template, **Then** no suggestion is
   shown (or a "Rest Day" indicator appears).
5. **Given** the suggestion is displayed, **When** the user taps
   "Start Workout" on the suggestion, **Then** a session is created
   from that template (same behavior as User Story 2).
6. **Given** a program has already been completed for today (session
   logged), **When** the user returns to the home screen, **Then**
   the suggestion shows as completed rather than prompting again.
7. **Given** the user has multiple programs, **When** they set one as
   active, **Then** only that program's schedule drives suggestions.
   Only one program can be active at a time.
8. **Given** the user is offline, **When** all program operations
   occur, **Then** everything works from local data.

---

### Edge Cases

- **Empty template**: A template with zero exercises cannot be started
  as a workout; the "Start Workout" button is disabled with a hint.
- **Deleted exercise**: If an exercise referenced by a template is
  deleted from the exercise library, the template entry is marked as
  unavailable and skipped during session creation. The user is
  notified.
- **Duplicate template names**: The system allows duplicate names but
  distinguishes templates by unique identity internally.
- **Day with multiple assignments**: A day in a program can only have
  one template assigned (not multiple).
- **Mid-session template edit**: If the user edits a template while a
  session started from it is active, the running session is not
  affected — it uses the snapshot taken at session start.
- **Program with no active day**: If today has no template in the
  active program, the home screen shows a neutral state, not an
  error.
- **Timezone**: "Today" is determined by the device's local timezone
  and locale settings for day-of-week.
- **Large template count**: Users with 20+ templates must still be
  able to browse and select quickly via the training style filter.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow users to create, edit, and delete
  workout templates with a name, an optional training style tag, and
  an ordered list of exercises.
- **FR-002**: Each exercise entry in a template MUST include target
  number of sets (integer ≥ 1), target reps per set (integer ≥ 1),
  and an optional target weight (number ≥ 0).
- **FR-003**: The system MUST allow users to reorder exercises within
  a template via drag-and-drop or equivalent gesture.
- **FR-004**: The system MUST display a list of all saved templates,
  filterable by training style tag.
- **FR-005**: The system MUST allow users to start a workout session
  from a template, creating a new session with all template
  exercises and their targets pre-loaded.
- **FR-006**: Pre-loaded targets MUST be editable before logging;
  once a set is logged, its values are final (per feature 001
  behavior).
- **FR-007**: Template-started sessions MUST allow adding exercises
  not defined in the template.
- **FR-008**: Template-started sessions MUST allow logging fewer or
  more sets than the template target per exercise.
- **FR-009**: The system MUST allow users to create programs that
  assign templates to specific days of the week (Monday–Sunday).
- **FR-010**: The system MUST allow exactly one program to be active
  at a time.
- **FR-011**: When an active program has a template assigned to the
  current day of the week, the home screen MUST display a suggestion
  card with the template name and a way to start the workout.
- **FR-012**: The suggestion card MUST show a "completed" state if a
  session for today's template has already been logged.
- **FR-013**: All template and program operations MUST work fully
  offline with no network dependency.
- **FR-014**: If an exercise in a template has been deleted from the
  exercise library, the system MUST mark it as unavailable and skip
  it during session creation, notifying the user.
- **FR-015**: Sessions started from a template MUST use a snapshot of
  the template at session-start time; subsequent template edits MUST
  NOT affect in-progress sessions.
- **FR-016**: Training style tags MUST include at least: Push, Pull,
  Legs, Upper, Lower, Full Body, Custom. Users may type a custom
  tag.

### Key Entities

- **WorkoutTemplate**: A named, reusable definition of a workout
  containing an ordered list of exercise entries, each with target
  sets, reps, and optional weight. Tagged with a training style.
- **TemplateExercise**: An entry within a template linking to an
  exercise, with an ordinal position, target sets, target reps, and
  optional target weight.
- **Program**: A named grouping of templates assigned to days of the
  week. Exactly one program may be active at any time.
- **ProgramDay**: An assignment of one template to one day of the
  week within a program.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create a template with 5 exercises and start
  a session from it in under 60 seconds on a phone.
- **SC-002**: Starting a session from a template reduces the number
  of taps to log the first set by at least 50% compared to starting
  a blank session and manually selecting the exercise.
- **SC-003**: Program suggestions appear on the home screen within 1
  second of app launch.
- **SC-004**: 90% of users who create a template reuse it within 7
  days, measured by session-from-template events.
- **SC-005**: All template and program screens function with the
  device in airplane mode, verified end-to-end.
- **SC-006**: Users with 20+ templates can find and start a specific
  template in under 10 seconds via the training style filter.

## Assumptions

- The existing workout logging system (feature 001) provides session
  creation and set logging; this feature integrates with it but does
  not modify its core write path.
- Feature 002 (progress tracking) reads from sessions/sets and will
  automatically reflect template-started sessions with no changes.
- Training style tags are stored as free-text strings with a
  predefined set of suggestions (Push, Pull, Legs, Upper, Lower,
  Full Body, Custom). Users are not restricted to the predefined
  list.
- "Today" for program suggestions is determined by the device's
  local timezone.
- A session can only be started from one template at a time; there
  is no "merge templates" functionality in v1.
- Template import/export and sharing between users are out of scope
  for v1.
- There is no notion of periodization, progressive overload
  automation, or deload scheduling in v1 — programs are simple
  weekly schedules that repeat.
- Template history (tracking which templates a user has started over
  time) is out of scope for v1; sessions record only the data
  defined in feature 001.
