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

- [ ] T001 Create directories: `src/app/templates/`, `src/app/programs/`, `src/models/` (exists), `src/services/` (exists), `src/components/` (exists)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema migration and shared models required by all three user stories.

**⚠️ CRITICAL**: No user story can start until this phase is complete.

- [ ] T002 Write migration `src/db/migrations/002-templates.ts` — create tables `templates`, `template_exercises`, `programs`, `program_days`, `session_targets` per `data-model.md`; ALTER `sessions` ADD COLUMN `template_id TEXT`; create indexes per data-model; export as `migration002`
- [ ] T003 Register `migration002` in `src/db/database.ts` — add import and append to `migrations` array
- [ ] T004 [P] Create `src/models/template.ts` — export `WorkoutTemplate`, `TemplateExercise`, `TemplateDetail` interfaces per `data-model.md`
- [ ] T005 [P] Create `src/models/program.ts` — export `DayOfWeek` type, `DAY_NAMES` constant, `Program`, `ProgramDay`, `ProgramDetail` interfaces per `data-model.md`
- [ ] T006 [P] Create `src/models/session-target.ts` — export `SessionTarget` interface per `data-model.md`

**Checkpoint**: Schema and models in place — user-story phases can begin.

---

## Phase 3: User Story 1 - Create and Manage a Workout Template (Priority: P1) 🎯 MVP

**Goal**: Users can create, view, edit, reorder exercises in, and delete workout templates with a name, training style tag, and ordered exercise list with target sets/reps/weight.

**Independent Test**: Create a template "Push Day" with 3 exercises (bench press, overhead press, tricep dip) each with target sets/reps/weight. Save. View in template list filtered by "Push". Edit to reorder exercises. Delete.

### Tests for User Story 1

- [ ] T007 [P] [US1] Unit tests for `template-service` in `tests/unit/template-service.test.ts` — mock expo-sqlite + expo-crypto; test createTemplate (transaction, ordinals assigned), listTemplates (alphabetical, filter by styleTag), getTemplateDetail (joins exercise names), updateTemplate (name/tag), deleteTemplate, addTemplateExercise, removeTemplateExercise (renumbers ordinals), moveTemplateExercise up/down (boundary no-ops), updateTemplateExercise

### Implementation for User Story 1

- [ ] T008 [US1] Implement `src/services/template-service.ts` per `contracts/template-service.md` — createTemplate (transaction: insert template + exercises with ordinals 0..N-1), listTemplates (alphabetical, optional styleTag WHERE), getTemplateDetail (JOIN exercises + exercise names), updateTemplate, deleteTemplate, addTemplateExercise, removeTemplateExercise (renumber), moveTemplateExercise (swap ordinals in transaction), updateTemplateExercise
- [ ] T009 [P] [US1] Build `src/components/TemplateExerciseRow.tsx` — props per contracts: exercise name, target sets × reps @ weight, move-up/move-down buttons (disabled when isFirst/isLast), remove button, edit targets inline; ≥40px touch targets
- [ ] T010 [P] [US1] Build `src/components/TemplateCard.tsx` — props per contracts: template name, style tag chip, exercise count; Pressable with onPress
- [ ] T011 [US1] Build `src/components/TemplateForm.tsx` — name TextInput, style tag selector (predefined chips: Push/Pull/Legs/Upper/Lower/Full Body + custom text input), exercise list using `TemplateExerciseRow`, "Add Exercise" button opening existing `ExercisePicker`, collect targetSets/targetReps/targetWeight per exercise; onSave returns `CreateTemplateInput`
- [ ] T012 [US1] Build `src/app/templates/create.tsx` route — renders `TemplateForm`, on save calls `createTemplate`, navigates back to template list
- [ ] T013 [US1] Build `src/app/templates/index.tsx` route — FlatList of `TemplateCard`s from `listTemplates()`; training style filter chips at top; empty state "No templates yet" with create button; FAB or header button to navigate to create
- [ ] T014 [US1] Build `src/app/templates/[id].tsx` route — loads `getTemplateDetail`, renders read-only template view with exercise list; "Edit" button enters edit mode (renders `TemplateForm` with initial data); "Delete" button with confirmation alert; "Start Workout" button (disabled + hint if zero exercises; wired in US2)
- [ ] T015 [US1] Add "Templates" tab to `src/app/_layout.tsx` — tab icon and label; add hidden route entries for `templates/create` and `templates/[id]`
- [ ] T016 [US1] Airplane-mode manual verification of template CRUD — **user-executed on device**

**Checkpoint**: User Story 1 — full template lifecycle works, ready to ship as MVP.

---

## Phase 4: User Story 2 - Start a Session From a Template (Priority: P2)

**Goal**: Users tap "Start Workout" on a template and get a new session with all exercises and targets pre-loaded. They can confirm pre-filled values, adjust them, add extra exercises, and log fewer/more sets than targets suggest. Force-close recovery restores targets.

**Independent Test**: Open a saved template, tap "Start Workout", verify session created with exercises listed in template order. Log a set with pre-filled values. Adjust weight on next set. Add an exercise not in template. Force-close, reopen, verify session + targets restored.

### Tests for User Story 2

- [ ] T017 [P] [US2] Unit tests for `session-template-service` in `tests/unit/session-template-service.test.ts` — mock expo-sqlite + expo-crypto + session-service.createSession; test startSessionFromTemplate (creates session, sets template_id, inserts session_targets in order, skips deleted exercises with warning), getSessionTargets (returns ordered targets for session, empty for non-template session)

### Implementation for User Story 2

- [ ] T018 [US2] Implement `src/services/session-template-service.ts` per contracts — startSessionFromTemplate: in transaction call createSession(), UPDATE sessions SET template_id, SELECT template_exercises JOIN exercises (skip where exercise missing → collect warnings), INSERT into session_targets; getSessionTargets: SELECT from session_targets WHERE session_id ORDER BY ordinal
- [ ] T019 [US2] Build `src/components/TemplateSessionView.tsx` — per contracts: for each target exercise, show exercise name + progress (e.g., "2/3 sets done"), pre-fill weight/reps from target, "Log Set" button calls onLogSet; dimmed/completed state for exercises where logged sets ≥ target_sets; section at bottom for extra (non-template) exercises
- [ ] T020 [US2] Wire "Start Workout" in `src/app/templates/[id].tsx` — on press: call startSessionFromTemplate, navigate to home screen (which detects active session); pass template_id via router params or context
- [ ] T021 [US2] Integrate `TemplateSessionView` into `src/app/index.tsx` home screen — when active session has template_id: load session targets via getSessionTargets, render TemplateSessionView alongside existing SetLogForm/SetList; when no template_id: existing behavior unchanged
- [ ] T022 [US2] Handle force-close recovery in `src/context/SessionContext.tsx` — on mount, if active session has template_id, also load session_targets and expose them in context state so TemplateSessionView can render
- [ ] T023 [US2] Airplane-mode manual verification of template session flow — **user-executed on device**

**Checkpoint**: User Stories 1 and 2 functional — templates can be created and used to start sessions.

---

## Phase 5: User Story 3 - Create and Follow a Program (Priority: P3)

**Goal**: Users create programs assigning templates to weekdays. One program is active at a time. Home screen shows a suggestion card for today's template (or completed/rest-day state).

**Independent Test**: Create a program with templates on Mon/Wed/Fri. Activate it. On Monday: verify suggestion card shows correct template. Tap "Start Workout" on suggestion. Return to home: see "completed" state. On Tuesday: see rest-day/no suggestion.

### Tests for User Story 3

- [ ] T024 [P] [US3] Unit tests for `program-service` in `tests/unit/program-service.test.ts` — mock expo-sqlite + expo-crypto; test createProgram (transaction, day assignments), listPrograms, getProgramDetail (joins template names), deleteProgram, setActiveProgram (deactivates others in transaction), clearActiveProgram, assignDay (replaces existing), unassignDay, getTodaySuggestion (returns template for today's day-of-week from active program; returns null when no active program; returns alreadyCompleted=true when session with template_id exists today; returns null for unassigned day)

### Implementation for User Story 3

- [ ] T025 [US3] Implement `src/services/program-service.ts` per contracts — createProgram (transaction: INSERT program + program_days), listPrograms, getProgramDetail (JOIN program_days + templates for names), deleteProgram, setActiveProgram (UPDATE all to 0 then target to 1 in transaction), clearActiveProgram, assignDay (INSERT OR REPLACE on unique constraint), unassignDay (DELETE), getTodaySuggestion (get active program → get today's day_of_week → lookup program_days → load template detail → check if session with template_id started today exists → return TodaySuggestion or null)
- [ ] T026 [P] [US3] Build `src/components/ProgramDayRow.tsx` — shows day name, assigned template name (or "Rest Day" / "Tap to assign"), onPress to assign/change template
- [ ] T027 [P] [US3] Build `src/components/ProgramForm.tsx` — name TextInput, 7 `ProgramDayRow` components (Mon–Sun), "Assign Template" opens a picker/modal listing saved templates; onSave returns `CreateProgramInput`
- [ ] T028 [P] [US3] Build `src/components/SuggestionCard.tsx` — per contracts: show template name + exercise count + "Start Workout" button; "Completed" badge variant when alreadyCompleted; rest-day variant (or null)
- [ ] T029 [US3] Build `src/app/programs/create.tsx` route — renders `ProgramForm`, on save calls `createProgram`, navigates back
- [ ] T030 [US3] Build `src/app/programs/index.tsx` route — FlatList of programs; active program highlighted; tap to view detail; long-press or menu to set active / delete; empty state with create button
- [ ] T031 [US3] Build `src/app/programs/[id].tsx` route — loads `getProgramDetail`, renders day assignments; "Set Active" / "Deactivate" button; "Edit" / "Delete" actions
- [ ] T032 [US3] Integrate `SuggestionCard` into `src/app/index.tsx` home screen — when no active session: call getTodaySuggestion; if suggestion exists, render SuggestionCard above the "Start Workout" button; tapping "Start Workout" on card calls startSessionFromTemplate (reuses US2 flow)
- [ ] T033 [US3] Add navigation entry for programs — either a sub-tab under Templates, a settings entry, or a separate "Programs" tab in `src/app/_layout.tsx`; add hidden route entries for `programs/create` and `programs/[id]`
- [ ] T034 [US3] Airplane-mode manual verification of program flow — **user-executed on device**

**Checkpoint**: All three user stories functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T035 [P] Run `npm test` — all new and existing unit tests pass
- [ ] T036 [P] Run `npm run lint` — zero warnings in new files
- [ ] T037 Verify feature 001 regression: start a blank session (no template), log sets, end session — existing flow unchanged
- [ ] T038 Verify feature 002 regression: open Progress tab, verify template-started sessions appear in trends and dashboard
- [ ] T039 Performance check: template list with 20+ items loads <1s; suggestion card appears <1s on home screen — **user-executed**
- [ ] T040 Walk `quickstart.md` end-to-end on a real device — **user-executed**

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
