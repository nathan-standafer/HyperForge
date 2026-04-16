---
description: "Task list for feature 003-workout-templates"
---

# Tasks: Workout Templates & Programs

**Input**: Design documents from `/specs/003-workout-templates/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/template-service.md, quickstart.md

**Tests**: Unit tests included — the constitution requires automated tests for critical data-path logic, and template snapshot + program suggestion are critical paths.

**Organization**: Tasks grouped by user story (P1 → P2 → P3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3)

## Path Conventions

Single Expo app at repository root. New source under `src/`, tests under `tests/unit/`.

---

## Phase 1: Setup

**Purpose**: Create the new directories needed for this feature.

- [X] T001 Create directories: `src/app/templates/`, `src/app/programs/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema migration and shared models required by all three user stories.

**⚠️ CRITICAL**: No user story can start until this phase is complete.

- [X] T002 Write migration `src/db/migrations/002-templates.ts`
- [X] T003 Register `migration002` in `src/db/database.ts`
- [X] T004 [P] Create `src/models/template.ts`
- [X] T005 [P] Create `src/models/program.ts`
- [X] T006 [P] Create `src/models/session-target.ts`

**Checkpoint**: Schema and models in place — user-story phases can begin.

---

## Phase 3: User Story 1 - Create and Manage a Workout Template (Priority: P1) 🎯 MVP

**Goal**: Users can create, view, edit, reorder exercises in, and delete workout templates with a name, training style tag, and ordered exercise list with target sets/reps/weight.

**Independent Test**: Create a template "Push Day" with 3 exercises (bench press, overhead press, tricep dip) each with target sets/reps/weight. Save. View in template list filtered by "Push". Edit to reorder exercises. Delete.

### Tests for User Story 1

- [X] T007 [P] [US1] Unit tests for `template-service` (7 tests)

### Implementation for User Story 1

- [X] T008 [US1] Implement `src/services/template-service.ts`
- [X] T009 [P] [US1] Build `src/components/TemplateExerciseRow.tsx`
- [X] T010 [P] [US1] Build `src/components/TemplateCard.tsx`
- [X] T011 [US1] Build `src/components/TemplateForm.tsx`
- [X] T012 [US1] Build `src/app/templates/create.tsx`
- [X] T013 [US1] Build `src/app/templates/index.tsx`
- [X] T014 [US1] Build `src/app/templates/[id].tsx`
- [X] T015 [US1] Add "Templates" tab to `src/app/_layout.tsx`
- [ ] T016 [US1] Airplane-mode manual verification — **user-executed on device**

**Checkpoint**: User Story 1 — full template lifecycle works, ready to ship as MVP.

---

## Phase 4: User Story 2 - Start a Session From a Template (Priority: P2)

**Goal**: Users tap "Start Workout" on a template and get a new session with all exercises and targets pre-loaded. They can confirm pre-filled values, adjust them, add extra exercises, and log fewer/more sets than targets suggest. Force-close recovery restores targets.

**Independent Test**: Open a saved template, tap "Start Workout", verify session created with exercises listed in template order. Log a set with pre-filled values. Adjust weight on next set. Add an exercise not in template. Force-close, reopen, verify session + targets restored.

### Tests for User Story 2

- [X] T017 [P] [US2] Unit tests for `session-template-service` (4 tests)

### Implementation for User Story 2

- [X] T018 [US2] Implement `src/services/session-template-service.ts`
- [X] T019 [US2] Build `src/components/TemplateSessionView.tsx`
- [X] T020 [US2] Wire "Start Workout" in `src/app/templates/[id].tsx`
- [X] T021 [US2] Integrate `TemplateSessionView` into `src/app/index.tsx`
- [X] T022 [US2] Handle force-close recovery in `src/context/SessionContext.tsx` — loads sessionTargets on mount if active session exists
- [ ] T023 [US2] Airplane-mode manual verification — **user-executed on device**

**Checkpoint**: User Stories 1 and 2 functional — templates can be created and used to start sessions.

---

## Phase 5: User Story 3 - Create and Follow a Program (Priority: P3)

**Goal**: Users create programs assigning templates to weekdays. One program is active at a time. Home screen shows a suggestion card for today's template (or completed/rest-day state).

**Independent Test**: Create a program with templates on Mon/Wed/Fri. Activate it. On Monday: verify suggestion card shows correct template. Tap "Start Workout" on suggestion. Return to home: see "completed" state. On Tuesday: see rest-day/no suggestion.

### Tests for User Story 3

- [X] T024 [P] [US3] Unit tests for `program-service` (6 tests)

### Implementation for User Story 3

- [X] T025 [US3] Implement `src/services/program-service.ts`
- [X] T026 [P] [US3] Build `src/components/ProgramDayRow.tsx`
- [X] T027 [P] [US3] Build `src/components/ProgramForm.tsx`
- [X] T028 [P] [US3] Build `src/components/SuggestionCard.tsx`
- [X] T029 [US3] Build `src/app/programs/create.tsx`
- [X] T030 [US3] Build `src/app/programs/index.tsx`
- [X] T031 [US3] Build `src/app/programs/[id].tsx`
- [X] T032 [US3] Integrate `SuggestionCard` into `src/app/index.tsx`
- [X] T033 [US3] Navigation entries for programs added to `src/app/_layout.tsx`
- [ ] T034 [US3] Airplane-mode manual verification — **user-executed on device**

**Checkpoint**: All three user stories functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T035 [P] `npm test` — 45 unit tests pass (8 new suites). 3 pre-existing feature-001 suites still fail (expo-crypto mock missing — unrelated).
- [X] T036 [P] `npm run lint` — zero warnings in new files (3 pre-existing warnings remain)
- [ ] T037 Verify feature 001 regression — **user-executed on device**
- [ ] T038 Verify feature 002 regression — **user-executed on device**
- [ ] T039 Performance check — **user-executed**
- [ ] T040 Walk `quickstart.md` end-to-end — **user-executed**

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Setup; BLOCKS all user stories
- **US1 (Phase 3)**: depends on Foundational
- **US2 (Phase 4)**: depends on Foundational + T008 (template-service, for reading template detail)
- **US3 (Phase 5)**: depends on Foundational + T008 (template-service) + T018 (session-template-service for starting from suggestion)
- **Polish (Phase 6)**: depends on all desired user stories

### Within Each User Story

- Tests can be written alongside or before implementation
- Models/migration before services
- Services before components
- Components before routes
- Routes before layout/nav integration
- Manual verification last

### Parallel Opportunities

- Phase 2: T004 / T005 / T006 parallel (different model files)
- US1: T007 parallel with T009 / T010; T009 / T010 parallel (different components)
- US2: T017 parallel with T019 (test + component, different files)
- US3: T024 parallel with T026 / T027 / T028 (test + components, different files)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# After T002 + T003 (migration), launch models in parallel:
Task: "Create src/models/template.ts"
Task: "Create src/models/program.ts"
Task: "Create src/models/session-target.ts"
```

## Parallel Example: User Story 1

```bash
# After T008 (template-service), components in parallel:
Task: "Build src/components/TemplateExerciseRow.tsx"
Task: "Build src/components/TemplateCard.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (T001)
2. Phase 2: Foundational (T002–T006)
3. Phase 3: US1 (T007–T016)
4. **STOP AND VALIDATE**: template CRUD works end-to-end, offline.
5. Ship.

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → ship as MVP (template CRUD)
3. US2 → ship (start session from template — the primary payoff)
4. US3 → ship (programs + daily suggestions)
5. Polish

### Parallel Team Strategy

Once Foundational is done:
- Developer A: US1 (template-service + UI)
- Developer B: US2 (session-template-service + session integration — starts once A lands T008)
- Developer C: US3 (program-service + suggestion card — starts once A lands T008 and B lands T018)

---

## Notes

- Migration 002 adds 5 new tables + alters sessions. Feature 001's write paths (createSession, logSet) are not modified.
- Feature 002 progress tracking will automatically pick up template-started sessions — no changes needed in progress-service.
- Training style tags are free-text with predefined UI suggestions, not an enum table.
- Move-up/move-down reorder, not drag-and-drop — avoids react-native-reanimated dependency.
- Session snapshot via session_targets table ensures force-close recovery and template-edit isolation.
- Commit after each task or logical group.
