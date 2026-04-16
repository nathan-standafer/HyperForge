# Quickstart: Workout Logging

## Prerequisites

- Node.js 20+
- npm or yarn
- Expo CLI (`npx expo`)
- iOS Simulator (macOS) or Android Emulator, or Expo Go on a
  physical device

## Setup

```bash
# Clone and install
git clone <repo-url> && cd HyperForge
npm install

# Start the development server
npx expo start
```

## Verify: Log Your First Set

1. Open the app on your device/simulator.
2. Tap **Start Workout** to create a new session.
3. Tap an exercise from the recent/favorites list (or browse by
   muscle group).
4. Verify weight and reps are pre-filled (defaults for first use).
5. Adjust weight with the ±2.5 kg buttons or tap the value to type.
6. Enter reps. Optionally enter RIR.
7. Tap **Log Set**.
8. Verify the set appears in the session view with correct data.

**Expected**: Set logged in ≤3 taps (exercise select + log button;
weight/reps pre-filled from defaults).

## Verify: Complete a Session

1. Log 2-3 more sets (same or different exercises).
2. Tap **End Workout**.
3. Verify the session summary shows total sets, volume, and duration.

## Verify: Review Past Workouts

1. Navigate to workout history.
2. Verify completed sessions appear in reverse chronological order.
3. Tap a session to see all sets grouped by exercise.

## Verify: Offline Mode

1. Enable airplane mode on your device.
2. Start a workout and log a set.
3. Verify the set is saved and visible (no errors or degradation).

## Run Tests

```bash
# Unit and component tests
npm test

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```
