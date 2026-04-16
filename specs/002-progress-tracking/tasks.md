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

- [ ] T001 Install charting dependencies: `npm install victory-native` and `npx expo install react-native-svg` (updates `package.json` and `package-lock.json` at repo root)
- [ ] T002 Create new directories: `src/lib/`, `src/app/progress/exercise/`, `src/app/progress/prs/`, `tests/unit/` (may already exist), `tests/component/` (may already exist)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared primitives used by every user story: the 1RM formula, the time-range resolver, and the unit-conversion helper. Both US1 and US2 call these; US3 calls `one-rm`.

**⚠️ CRITICAL**: No user story can start until this phase is complete.

- [ ] T003 [P] Implement `estimateOneRm(weight, reps)` (Epley) in `src/lib/one-rm.ts` per `contracts/progress-service.md` (returns null for `weight <= 0` or `reps < 1`; rounds to 2 decimals)
- [ ] T004 [P] Implement `resolveRange(range, now?)` and `isoWeekOf(date)` in `src/lib/time-range.ts` per `contracts/progress-service.md` (4w / 3m / 6m / 1y / all → `{start, end}`)
- [ ] T005 [P] Implement `toPreferredUnit(value, storedUnit, preferredUnit)` helper in `src/lib/units.ts` (kg ↔ lb conversion; reuse any existing preference reader from feature 001 if present, otherwise add a TODO marker for integration)
- [ ] T006 [P] Unit tests for `one-rm` in `tests/unit/one-rm.test.ts` (happy path, zero weight, negative reps, rounding)
- [ ] T007 [P] Unit tests for `time-range` in `tests/unit/time-range.test.ts` (all five ranges, `all` returns epoch, ISO-week Monday boundary)
- [ ] T008 [P] Unit tests for `units` in `tests/unit/units.test.ts` (kg→lb, lb→kg, same-unit passthrough)

**Checkpoint**: Foundational libs in place — user-story phases can now begin.

---

## Phase 3: User Story 1 - See Per-Exercise Trend Over Time (Priority: P1) 🎯 MVP

**Goal**: User opens any exercise and sees its time-series trend for top weight, estimated 1RM, and total volume, filterable by time range. Tapping a chart point shows session detail.

**Independent Test**: With at least two sessions logged for one exercise, open that exercise in the progress view and verify a time-series chart renders showing weight, 1RM, and volume per session in chronological order; changing the time-range filter re-renders; tapping a point shows session date / weight / reps / 1RM.

### Tests for User Story 1

- [ ] T009 [P] [US1] Unit tests for `progress-service` in `tests/unit/progress-service.test.ts` — seed an in-memory/test SQLite with fixed sessions/sets; assert `SessionPoint` values (topWeight, topWeightReps, estimatedOneRm, totalVolume, setCount), chronological order, empty-state return, single-point case, range filtering
- [ ] T010 [P] [US1] Component test for `TrendChart` in `tests/component/TrendChart.test.tsx` — renders line+scatter for populated data; renders empty state for `points: []`; renders single point with no line for `points.length === 1`; fires `onPointPress` with the correct `SessionPoint`
- [ ] T011 [P] [US1] Component test for `TimeRangeFilter` in `tests/component/TimeRangeFilter.test.tsx` — renders five chips, highlights current value, fires `onChange` on tap

### Implementation for User Story 1

- [ ] T012 [US1] Implement `getExerciseProgress(exerciseId, range)` in `src/services/progress-service.ts` per `contracts/progress-service.md` — single SQL read joining `sets`, `sessions`, `exercises`; group by session; compute top weight (ties broken by higher reps), Epley 1RM of heaviest-1RM set, total volume, set count; convert to preferred unit; return chronologically ascending points; empty-safe
- [ ] T013 [P] [US1] Build `src/components/TrendChart.tsx` — props `{ points, metric: 'weight'|'1rm'|'volume', unit, onPointPress? }`; uses `victory-native` `VictoryLine` + `VictoryScatter`; WCAG-AA palette; renders empty state for `points.length === 0`
- [ ] T014 [P] [US1] Build `src/components/TimeRangeFilter.tsx` — five chips (`4w`, `3m`, `6m`, `1y`, `All`); current value visually highlighted; single-tap selects
- [ ] T015 [US1] Build `src/app/progress/exercise/[id].tsx` route — loads exercise name; renders `TimeRangeFilter`, a metric selector (weight / 1RM / volume), and `TrendChart`; tapping a point reveals a detail card (date, weight, reps, 1RM); empty state for no data; depends on T012 T013 T014
- [ ] T016 [US1] Ensure the exercise progress route is reachable: add a "View Progress" entry point from the existing exercise list / exercise picker in `src/app/exercise-select.tsx` (or the nearest equivalent screen from feature 001) — minimal navigation addition, no UX redesign
- [ ] T017 [US1] Airplane-mode manual verification per `quickstart.md` — run on device/simulator, toggle airplane mode, verify every chart and filter continues to render from local SQLite

**Checkpoint**: User Story 1 is a fully-functional MVP — ship here if desired.

---

## Phase 4: User Story 2 - Dashboard of Recent Activity (Priority: P2)

**Goal**: Dashboard summarizing recent workouts (workout count, total volume, workouts/week, current streak) plus a list of recent PRs, filterable by time range.

**Independent Test**: With logged sessions across the last 4 weeks, open the Progress tab's dashboard and verify it shows workout count, total volume, workouts/week, current streak, and recent PRs for the selected range; changing the time range recomputes all metrics; empty state shown with no logged sessions.

### Tests for User Story 2

- [ ] T018 [P] [US2] Unit tests for `pr-service#getRecentPrs` in `tests/unit/pr-service.test.ts` (seeded fixture; correct weights per rep bucket; Epley 1RM bucket; `achievedOn` within range filtering; newest-first ordering)
- [ ] T019 [P] [US2] Unit tests for `dashboard-service` in `tests/unit/dashboard-service.test.ts` (workout count, total volume, workouts-per-week rounding, current streak breaks on first empty week, empty-state zeros, reference 12-week hand-calculated dataset)

### Implementation for User Story 2

- [ ] T020 [P] [US2] Implement `getRecentPrs(range)` in `src/services/pr-service.ts` per `contracts/progress-service.md` (scans all sets in range, returns PRs newest-first)
- [ ] T021 [US2] Implement `getDashboardSummary(range)` in `src/services/dashboard-service.ts` per `contracts/progress-service.md` — computes workoutCount, totalVolume, workoutsPerWeek, currentStreakWeeks (walk backward ISO weeks Mon–Sun from current week), recentPRs (delegates to T020); empty-safe; depends on T020
- [ ] T022 [P] [US2] Build `src/components/DashboardSummary.tsx` — four metric cards + streak; empty state for `workoutCount === 0`
- [ ] T023 [P] [US2] Build `src/components/RecentPRList.tsx` — renders `PersonalRecord[]` newest-first; shows exercise name, weight × reps, achievement date
- [ ] T024 [US2] Build `src/app/progress/index.tsx` dashboard route — renders `TimeRangeFilter`, `DashboardSummary`, `RecentPRList`; depends on T021 T022 T023
- [ ] T025 [US2] Add "Progress" tab to `src/app/_layout.tsx` pointing to `src/app/progress/index.tsx` (landing on the dashboard); tab icon and label only — no other layout changes
- [ ] T026 [US2] Airplane-mode manual verification of dashboard per `quickstart.md`

**Checkpoint**: User Stories 1 and 2 both functional and independently testable.

---

## Phase 5: User Story 3 - Personal Record History Per Exercise (Priority: P3)

**Goal**: Per-exercise PR list showing heaviest weight per standard rep range (1, 3, 5, 8, 10+) and all-time estimated 1RM, with achievement dates.

**Independent Test**: Open an exercise's PR history and verify the list shows, for each of the five rep buckets and the Epley 1RM bucket, the correct best-ever weight and the date achieved — cross-check against raw logs.

### Tests for User Story 3

- [ ] T027 [P] [US3] Unit tests for `pr-service#getExercisePrs` in `tests/unit/pr-service.test.ts` (extend existing file from T018) — buckets 1/3/5/8/10+ and "1rm"; correct weight-per-bucket; tie-breaking; bodyweight exercise excluded from weight buckets

### Implementation for User Story 3

- [ ] T028 [US3] Implement `getExercisePrs(exerciseId)` in `src/services/pr-service.ts` per `contracts/progress-service.md` — one pass over the exercise's sets, track best weight per rep bucket and max Epley 1RM; return `PersonalRecord[]`
- [ ] T029 [P] [US3] Build `src/components/PRHistoryList.tsx` — renders bucketed PRs with date; empty state for no records
- [ ] T030 [US3] Build `src/app/progress/prs/[exerciseId].tsx` route — loads exercise name, calls `getExercisePrs`, renders `PRHistoryList`; depends on T028 T029
- [ ] T031 [US3] Add "View PRs" link from `src/app/progress/exercise/[id].tsx` to the PR history route
- [ ] T032 [US3] Airplane-mode manual verification of PR history per `quickstart.md`

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T033 [P] Run `npm test` — all new and existing tests pass
- [ ] T034 [P] Run `npm run lint` — zero warnings in new files
- [ ] T035 Performance pass on a mid-range device with a synthetic one-year dataset (~150 sessions / ~2000 sets): verify progress view opens <2s and range filter changes <500ms per success criteria SC-001 / SC-002
- [ ] T036 Accessibility audit of new components (`TrendChart`, `TimeRangeFilter`, `DashboardSummary`, `RecentPRList`, `PRHistoryList`): WCAG AA contrast, touch-target sizes (constitution I)
- [ ] T037 Walk `quickstart.md` end-to-end on a real device as the acceptance gate

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
