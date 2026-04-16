---
description: "Task list for feature 002-progress-tracking"
---

# Tasks: Progress Tracking & Charts

**Input**: Design documents from `/specs/002-progress-tracking/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/progress-service.md, quickstart.md

**Tests**: Unit tests are included — the constitution requires automated tests for critical data-path logic (set recording, progress calculation, sync/merge), and progress calculation is the core of this feature.

**Organization**: Tasks are grouped by user story (P1 → P2 → P3) so each story can be shipped as an independent increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3)

## Path Conventions

Single Expo app at repository root. New source lives under `src/` and tests under `tests/`, mirroring feature 001's layout.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the one new dependency required by this feature.

- [X] T001 Install charting dependencies — **pivoted**: `victory-native@41` requires `@shopify/react-native-skia` (heavyweight); installed only `react-native-svg` and implemented trend chart with SVG primitives. `package.json` updated.
- [X] T002 Create new directories: `src/lib/`, `src/app/progress/exercise/`, `src/app/progress/prs/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared primitives used by every user story: the 1RM formula, the time-range resolver, and the unit-conversion helper. Both US1 and US2 call these; US3 calls `one-rm`.

**⚠️ CRITICAL**: No user story can start until this phase is complete.

- [X] T003 [P] Implement `estimateOneRm(weight, reps)` (Epley) in `src/lib/one-rm.ts`
- [X] T004 [P] Implement `resolveRange(range, now?)` and `isoWeekOf(date)` in `src/lib/time-range.ts`
- [~] T005 [P] ~~`src/lib/units.ts`~~ — **skipped** per user decision: no unit-preference system in feature 001; passthrough of stored values is v1 behavior.
- [X] T006 [P] Unit tests for `one-rm` in `tests/unit/one-rm.test.ts` (4 tests)
- [X] T007 [P] Unit tests for `time-range` in `tests/unit/time-range.test.ts` (8 tests)
- [~] T008 [P] ~~Unit tests for `units`~~ — skipped with T005.

**Infra fix**: `jest.config.ts` switched to pure `ts-jest` for `tests/unit/`. The `preset: 'react-native'` from feature 001 pulls in `react-native/jest/setup.js` which has Flow syntax that `ts-jest` can't parse — this had already blocked feature 001's tests from ever running. Component tests under `tests/component/` are excluded from the test runner until a babel-jest config is added (out of scope for this feature).

**Checkpoint**: Foundational libs in place — user-story phases can now begin.

---

## Phase 3: User Story 1 - See Per-Exercise Trend Over Time (Priority: P1) 🎯 MVP

**Goal**: User opens any exercise and sees its time-series trend for top weight, estimated 1RM, and total volume, filterable by time range. Tapping a chart point shows session detail.

**Independent Test**: With at least two sessions logged for one exercise, open that exercise in the progress view and verify a time-series chart renders showing weight, 1RM, and volume per session in chronological order; changing the time-range filter re-renders; tapping a point shows session date / weight / reps / 1RM.

### Tests for User Story 1

- [X] T009 [P] [US1] Unit tests for `progress-service` (6 tests: empty state, aggregation, ordering, single point, bodyweight, range filter)
- [~] T010 [P] [US1] ~~Component test for `TrendChart`~~ — deferred: `tests/component/` RN test environment not functional (see infra fix note above)
- [~] T011 [P] [US1] ~~Component test for `TimeRangeFilter`~~ — deferred with T010

### Implementation for User Story 1

- [X] T012 [US1] Implement `getExerciseProgress(exerciseId, range)` in `src/services/progress-service.ts`
- [X] T013 [P] [US1] Build `src/components/TrendChart.tsx` — **pivoted** to `react-native-svg` primitives (line + circles) instead of victory-native
- [X] T014 [P] [US1] Build `src/components/TimeRangeFilter.tsx` (5 chips)
- [X] T015 [US1] Build `src/app/progress/exercise/[id].tsx` route (filter, metric toggle, chart, point-detail card, PR link)
- [~] T016 [US1] Entry point — **re-scoped**: instead of adding into the mid-workout exercise picker (would conflate flows), the new Progress tab landing lists exercises with trends. Met by T024/T025.
- [ ] T017 [US1] Airplane-mode manual verification — **user-executed on device**

**Checkpoint**: User Story 1 is a fully-functional MVP — ship here if desired.

---

## Phase 4: User Story 2 - Dashboard of Recent Activity (Priority: P2)

**Goal**: Dashboard summarizing recent workouts (workout count, total volume, workouts/week, current streak) plus a list of recent PRs, filterable by time range.

**Independent Test**: With logged sessions across the last 4 weeks, open the Progress tab's dashboard and verify it shows workout count, total volume, workouts/week, current streak, and recent PRs for the selected range; changing the time range recomputes all metrics; empty state shown with no logged sessions.

### Tests for User Story 2

- [X] T018 [P] [US2] Unit tests for `pr-service` — **merged with T027**: one file `tests/unit/pr-service.test.ts` with 7 tests covers both `getExercisePrs` and `getRecentPrs`
- [X] T019 [P] [US2] Unit tests for `dashboard-service` (3 tests: empty zeros, workout/volume in range, streak of consecutive weeks)

### Implementation for User Story 2

- [X] T020 [P] [US2] Implement `getRecentPrs(range)` in `src/services/pr-service.ts`
- [X] T021 [US2] Implement `getDashboardSummary(range)` in `src/services/dashboard-service.ts`
- [X] T022 [P] [US2] Build `src/components/DashboardSummary.tsx`
- [X] T023 [P] [US2] Build `src/components/RecentPRList.tsx`
- [X] T024 [US2] Build `src/app/progress/index.tsx` dashboard route (filter + summary + recent PRs + exercise list)
- [X] T025 [US2] Add "Progress" tab to `src/app/_layout.tsx`
- [ ] T026 [US2] Airplane-mode manual verification — **user-executed on device**

**Checkpoint**: User Stories 1 and 2 both functional and independently testable.

---

## Phase 5: User Story 3 - Personal Record History Per Exercise (Priority: P3)

**Goal**: Per-exercise PR list showing heaviest weight per standard rep range (1, 3, 5, 8, 10+) and all-time estimated 1RM, with achievement dates.

**Independent Test**: Open an exercise's PR history and verify the list shows, for each of the five rep buckets and the Epley 1RM bucket, the correct best-ever weight and the date achieved — cross-check against raw logs.

### Tests for User Story 3

- [X] T027 [P] [US3] Unit tests for `getExercisePrs` (included in `tests/unit/pr-service.test.ts`; covers buckets, ties, bodyweight exclusion, Epley bucket)

### Implementation for User Story 3

- [X] T028 [US3] Implement `getExercisePrs(exerciseId)` in `src/services/pr-service.ts`
- [X] T029 [P] [US3] Build `src/components/PRHistoryList.tsx`
- [X] T030 [US3] Build `src/app/progress/prs/[exerciseId].tsx` route
- [X] T031 [US3] "View PRs" link added to `src/app/progress/exercise/[id].tsx`
- [ ] T032 [US3] Airplane-mode manual verification — **user-executed on device**

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T033 [P] `npm test` — all 28 new unit tests pass (5 new suites). 3 pre-existing feature-001 suites still fail because they don't mock `expo-crypto` — unrelated to this feature.
- [X] T034 [P] `npm run lint` — zero warnings in new files (3 pre-existing warnings in feature-001 files remain)
- [ ] T035 Performance pass on a mid-range device — **user-executed**
- [ ] T036 Accessibility audit — **user-executed** (design uses WCAG-AA-compliant palette from feature 001, 40px+ touch targets)
- [ ] T037 Walk `quickstart.md` end-to-end on a real device — **user-executed**

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Setup; BLOCKS all user stories
- **US1 (Phase 3)**: depends on Foundational
- **US2 (Phase 4)**: depends on Foundational; no dependency on US1
- **US3 (Phase 5)**: depends on Foundational; extends `pr-service.ts` started in US2 (T020) — if shipping US3 before US2, implement `getExercisePrs` first in the same file
- **Polish (Phase 6)**: depends on all desired user stories being complete

### Within Each User Story

- Tests [P] can be written alongside or before implementation
- Lib/service code before components that consume it
- Components before the route that composes them
- Route before the manual airplane-mode verification

### Parallel Opportunities

- Phase 2: T003 / T004 / T005 / T006 / T007 / T008 all parallel (different files)
- US1: T009 / T010 / T011 parallel (tests); T013 / T014 parallel after T012 is in progress; T015 joins them
- US2: T018 / T019 parallel; T022 / T023 parallel after services land
- US3: T029 parallel with T028 scaffolding

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch lib implementations in parallel:
Task: "Implement estimateOneRm in src/lib/one-rm.ts"
Task: "Implement resolveRange/isoWeekOf in src/lib/time-range.ts"
Task: "Implement toPreferredUnit in src/lib/units.ts"

# Launch their unit tests in parallel:
Task: "Unit tests for one-rm in tests/unit/one-rm.test.ts"
Task: "Unit tests for time-range in tests/unit/time-range.test.ts"
Task: "Unit tests for units in tests/unit/units.test.ts"
```

## Parallel Example: User Story 1

```bash
# Tests authored together:
Task: "Unit tests for progress-service in tests/unit/progress-service.test.ts"
Task: "Component test for TrendChart in tests/component/TrendChart.test.tsx"
Task: "Component test for TimeRangeFilter in tests/component/TimeRangeFilter.test.tsx"

# After T012 lands, components in parallel:
Task: "Build src/components/TrendChart.tsx"
Task: "Build src/components/TimeRangeFilter.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (T001–T002)
2. Phase 2: Foundational (T003–T008)
3. Phase 3: US1 (T009–T017)
4. **STOP AND VALIDATE**: exercise trend chart works end-to-end, offline.
5. Ship.

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → ship as MVP (per-exercise trend)
3. US2 → ship (dashboard & recent PRs)
4. US3 → ship (PR history)
5. Polish

### Parallel Team Strategy

Once Foundational is done:

- Developer A: US1
- Developer B: US2 (will own `pr-service.ts` creation)
- Developer C: US3 (extends `pr-service.ts` — coordinate with B)

---

## Notes

- No schema migration. This feature is strictly read-only over feature 001's SQLite tables.
- All numeric weight/volume values are in the user's current preferred unit; conversion happens inside services.
- Empty-state handling is mandatory on every view — never show a blank chart or zeroed metrics as if they were real data.
- Commit after each task or logical group.
