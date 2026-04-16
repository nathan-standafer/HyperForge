# Tasks: Workout Logging

**Input**: Design documents from `/specs/001-workout-logging/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Constitution mandates automated tests for critical data-path logic (set recording, session lifecycle, exercise service). Tests included for data services and key components.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Project initialization and Expo scaffolding

- [x] T001 Initialize Expo project with TypeScript template, install expo-sqlite and expo-router dependencies
- [x] T002 [P] Configure ESLint and Prettier for TypeScript/React Native in project root
- [x] T003 [P] Configure Jest and React Native Testing Library in jest.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database layer and shared types that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] Define TypeScript types for Exercise, Session, Set, SessionDetail in src/models/exercise.ts, src/models/session.ts, src/models/set.ts (per contracts/data-service.md types)
- [x] T005 [P] Define muscle group enum and validation constants in src/models/exercise.ts
- [x] T006 Create SQLite database initialization with migration runner in src/db/database.ts
- [x] T007 Create initial schema migration (exercises, sessions, sets tables with indexes) in src/db/migrations/001-initial.ts
- [x] T008 Create built-in exercise seed data (20-30 exercises across all muscle groups) in src/db/seed.ts
- [x] T009 Create Expo Router root layout with tab navigation in src/app/_layout.tsx

**Checkpoint**: Foundation ready — database initializes, seed data loads, navigation shell renders

---

## Phase 3: User Story 1 - Log a Set During a Workout (Priority: P1) MVP

**Goal**: User can select an exercise, enter weight/reps, and log a set that persists to SQLite

**Independent Test**: Open app, select an exercise, enter weight and reps, tap "Log", verify set appears in session view

### Implementation for User Story 1

- [x] T010 [P] [US1] Implement exercise-service (listExercises, getRecentExercises, createExercise, toggleFavorite) in src/services/exercise-service.ts per contracts/data-service.md
- [x] T011 [P] [US1] Implement set-service (logSet, updateSet, deleteSet, getLastSetForExercise) in src/services/set-service.ts per contracts/data-service.md
- [x] T012 [US1] Implement SessionContext with useReducer for active session state in src/context/SessionContext.tsx (createSession, add/edit/delete set actions)
- [x] T013 [P] [US1] Build WeightStepper component with ±2.5 kg/±5 lb buttons and tappable numeric keypad overlay in src/components/WeightStepper.tsx
- [x] T014 [P] [US1] Build ExercisePicker component with recent/favorites tab, muscle group tab, search, and "+ Add Exercise" custom creation in src/components/ExercisePicker.tsx
- [x] T015 [US1] Build SetLogForm component (exercise display, WeightStepper, reps input, optional RIR, Log button) with pre-fill from last session in src/components/SetLogForm.tsx
- [x] T016 [US1] Build SetList component displaying logged sets grouped by exercise with auto-numbered set labels, edit/delete actions in src/components/SetList.tsx
- [x] T017 [US1] Build exercise selection screen using ExercisePicker in src/app/exercise-select.tsx
- [x] T018 [US1] Build home screen with active session view, SetLogForm, SetList, and "Start Workout" button in src/app/index.tsx

### Tests for User Story 1 (Constitution-mandated: critical data-path logic)

- [x] T019 [P] [US1] Unit test set-service: logSet persistence, getLastSetForExercise pre-fill, deleteSet renumbering, validation (weight ≥ 0, reps ≥ 1, rir 0-10) in tests/unit/set-service.test.ts
- [x] T020 [P] [US1] Unit test exercise-service: listExercises filtering, getRecentExercises, createExercise uniqueness, toggleFavorite in tests/unit/exercise-service.test.ts
- [x] T021 [P] [US1] Component test WeightStepper: increment/decrement taps, keypad toggle, pre-fill display in tests/component/WeightStepper.test.tsx
- [x] T022 [P] [US1] Component test SetLogForm: ≤3 tap logging flow, pre-fill behavior, RIR optional entry in tests/component/SetLogForm.test.tsx

**Checkpoint**: User Story 1 fully functional — user can log sets with exercise selection, weight stepper, and pre-fill. All logged sets persist and display correctly.

---

## Phase 4: User Story 2 - Manage a Workout Session (Priority: P2)

**Goal**: User can start, continue, and end workout sessions with sets grouped by session

**Independent Test**: Start a new session, log several sets, end the session, verify summary shows total sets/volume/duration

### Implementation for User Story 2

- [x] T023 [US2] Implement session-service (createSession, endSession, getActiveSession, listSessions, getSessionDetail with summary calculation) in src/services/session-service.ts per contracts/data-service.md
- [x] T024 [US2] Build SessionSummary component (total sets, total volume, duration, exercise count) in src/components/SessionSummary.tsx
- [x] T025 [US2] Add session lifecycle controls to home screen: "Start Workout" / "End Workout" buttons, session timer, active session guard (prompt if session already active) in src/app/index.tsx
- [x] T026 [US2] Add active session restoration on app launch — check for active session in SQLite and restore to SessionContext in src/context/SessionContext.tsx

### Tests for User Story 2 (Constitution-mandated: session lifecycle)

- [x] T027 [P] [US2] Unit test session-service: createSession (single active constraint), endSession (summary calculation), getActiveSession, listSessions pagination, session restoration in tests/unit/session-service.test.ts

**Checkpoint**: User Stories 1 AND 2 both work — sessions can be started/ended, sets are grouped, app survives force-close

---

## Phase 5: User Story 3 - Review Past Workouts (Priority: P3)

**Goal**: User can browse completed sessions and view set details for any past workout

**Independent Test**: After completing several sessions, open history, verify sessions listed chronologically with correct set details

### Implementation for User Story 3

- [x] T028 [US3] Build session history list screen with reverse chronological session cards (date, duration, exercise count) in src/app/history/index.tsx
- [x] T029 [US3] Build session detail screen showing all sets grouped by exercise with weight, reps, RIR, set numbers; include edit/delete set actions for past sessions in src/app/history/[id].tsx
- [x] T030 [US3] Add history tab navigation to app layout in src/app/_layout.tsx

**Checkpoint**: All three user stories independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T031 [P] Verify offline mode end-to-end (airplane mode: start session, log sets, end session, view history) per quickstart.md
- [ ] T032 [P] Verify ≤3 tap set logging flow on physical device per SC-001
- [x] T033 [P] Code cleanup, remove unused imports, ensure consistent code style across all files
- [ ] T034 Run full quickstart.md validation sequence

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (Phase 3) can proceed immediately after Phase 2
  - US2 (Phase 4) can proceed after Phase 2 (independent of US1 for service layer; home screen tasks update US1's screen)
  - US3 (Phase 5) can proceed after Phase 2 (uses session-service from US2, so best after US2)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) — T025 updates the home screen created in US1, so best sequenced after US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) — Uses session-service from US2 (T023), so best sequenced after US2

### Within Each User Story

- Services before components (services provide data for UI)
- Context before screens (screens consume context)
- Components before screens that use them
- Tests can run in parallel with each other after their subject is implemented

### Parallel Opportunities

- T002, T003 can run in parallel (Setup phase)
- T004, T005 can run in parallel (type definitions)
- T010, T011 can run in parallel (independent services)
- T013, T014 can run in parallel (independent components)
- T019, T020, T021, T022 can all run in parallel (independent test files)
- T028, T029 can run in parallel (independent screens, but T029 uses session-service)
- T031, T032, T033 can run in parallel (independent verification tasks)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Log a set on a phone, verify persistence
5. Deploy/demo if ready — this alone proves the core value proposition

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Demo (MVP!)
3. Add User Story 2 → Test independently → Demo (sessions work)
4. Add User Story 3 → Test independently → Demo (full feature)
5. Polish → Final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
