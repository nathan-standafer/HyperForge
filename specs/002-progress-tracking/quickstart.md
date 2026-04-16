# Quickstart: Progress Tracking & Charts

This feature adds three screens on top of the existing workout-logging
data. It ships in priority order so each increment is independently
valuable.

## Prerequisites

- Feature 001 (workout logging) merged and a SQLite database present
  with at least a few logged sessions.
- Expo dev environment set up (`npm install`, `npx expo start`).

## Install New Dependency

```sh
npm install victory-native react-native-svg
npx expo install react-native-svg   # ensures Expo-compatible version
```

## Build Order (matches user-story priorities)

### P1 — Exercise progress detail

1. Implement `src/lib/one-rm.ts` and `src/lib/time-range.ts` with
   unit tests (`tests/unit/one-rm.test.ts`, `time-range.test.ts`).
2. Implement `src/services/progress-service.ts#getExerciseProgress`
   reading from existing `sets`/`sessions` tables; unit test against
   a seeded SQLite fixture.
3. Build `src/components/TrendChart.tsx` and `TimeRangeFilter.tsx`.
4. Wire up `src/app/progress/exercise/[id].tsx` route.
5. Manual test: open any exercise with logged history; verify chart
   renders for weight, 1RM, and volume; change time range filter.

### P2 — Dashboard

1. Implement `src/services/dashboard-service.ts#getDashboardSummary`
   (workout count, total volume, weekly streak, workouts/week).
2. Implement `src/services/pr-service.ts#getRecentPrs`.
3. Build `src/components/DashboardSummary.tsx` and `RecentPRList.tsx`.
4. Wire up `src/app/progress/index.tsx` as the Progress tab landing.
5. Add the Progress tab to `src/app/_layout.tsx`.
6. Manual test: verify metrics match hand-calculated values for a
   known test dataset.

### P3 — PR history

1. Implement `src/services/pr-service.ts#getExercisePrs`.
2. Build `src/components/PRHistoryList.tsx`.
3. Wire up `src/app/progress/prs/[exerciseId].tsx`.
4. Link from the exercise progress screen ("View PRs").
5. Manual test: verify PR per rep bucket and all-time Epley 1RM
   match the underlying logs.

## Offline Verification

For each increment:

1. Put the device in airplane mode.
2. Open the Progress tab.
3. Verify dashboard, charts, and PR lists all render from local data.

## Running Tests

```sh
npm test && npm run lint
```

## Definition of Done (per story)

- Unit tests for new services/libs pass.
- Manual mobile test on a device or simulator.
- Airplane-mode verification passes.
- No change to existing feature-001 write paths.
- `npm run lint` clean.
