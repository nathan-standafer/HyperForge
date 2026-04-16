# Research: Workout Logging

## R1: Mobile Framework Selection

**Decision**: Expo (React Native) with Expo Router for navigation.

**Rationale**: Constitution specifies TypeScript/Node with a
cross-platform framework. Expo provides managed builds, OTA updates,
and removes native toolchain complexity — aligned with Ship & Iterate
and Simplicity principles. Expo Router offers file-based routing which
reduces boilerplate.

**Alternatives considered**:
- Bare React Native: More control but higher setup/maintenance cost.
  Not justified for v1.
- Flutter: Strong mobile framework but requires Dart, violating the
  TypeScript constraint.

## R2: Local Storage for Offline-First

**Decision**: SQLite via `expo-sqlite` (synchronous API).

**Rationale**: Constitution requires offline-capable operation and
data integrity (persist before confirm). SQLite is battle-tested for
on-device relational storage, supports transactions for atomic writes,
and the data is inherently relational (sessions → sets → exercises).
`expo-sqlite` is maintained by Expo and works on both iOS and Android.

**Alternatives considered**:
- AsyncStorage: Key-value only; poor fit for relational workout data
  with queries (e.g., "last weight for exercise X").
- WatermelonDB: Built on SQLite with sync support, but adds
  complexity not needed until remote sync is in scope.
- MMKV: Fast key-value store; same relational limitation as
  AsyncStorage.

## R3: State Management

**Decision**: React Context + useReducer for session state; direct
SQLite queries for persisted data.

**Rationale**: Simplicity principle — no external state management
library needed for v1. Active session state is small (current
session + sets being logged). Historical data is read directly from
SQLite. This avoids syncing two sources of truth.

**Alternatives considered**:
- Zustand: Lightweight but still an extra dependency for a small
  state surface.
- Redux: Over-engineered for single-user local-only state.

## R4: Weight Input UX Pattern

**Decision**: Stepper component with ±2.5 kg / ±5 lb buttons, pre-
filled from last session. Tapping the value opens a numeric keypad
overlay.

**Rationale**: Clarified in spec. Stepper handles the common case
(small increments between sessions) in 1-2 taps. Keypad fallback
covers arbitrary values. Pre-fill from last session means most sets
require zero weight input.

**Alternatives considered**:
- Slider: Imprecise for exact weights; frustrating with gloves.
- Plate calculator: Useful but adds scope; defer to future feature.

## R5: Exercise Selection UX Pattern

**Decision**: Two-tier picker — recent/favorites tab (default) and a
muscle-group-organized tab with search. Custom exercise creation via
"+ Add Exercise" button.

**Rationale**: Clarified in spec. Regulars see their usual exercises
immediately (1 tap). New users browse by muscle group. Search handles
edge cases. Keeps the ≤3 tap target achievable.

**Alternatives considered**:
- Single flat list: Too slow to scroll through 50+ exercises.
- Search-only: Requires typing, awkward with gym gloves.

## R6: Testing Strategy

**Decision**: Jest for unit tests on data logic (set recording,
volume calculation, pre-fill logic). React Native Testing Library for
component interaction tests. No E2E framework for v1.

**Rationale**: Constitution requires automated tests for critical
data-path logic. Unit tests on the data layer cover set persistence,
session lifecycle, and calculation correctness. Component tests verify
tap-count and input behavior. E2E (Detox/Maestro) deferred per
Simplicity — not mandatory for v1.

**Alternatives considered**:
- Detox: Full E2E but heavy setup; defer to post-MVP.
- Maestro: Simpler E2E but still adds CI complexity for v1.
