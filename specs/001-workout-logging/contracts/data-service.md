# Data Service Contracts: Workout Logging

These contracts define the internal service interfaces between the UI
layer and the SQLite data layer. Since this is a local-only mobile app
(no remote API for v1), contracts are expressed as TypeScript function
signatures.

## Session Service

```typescript
// Create a new workout session. Fails if an active session exists.
createSession(): Promise<Session>

// End the active session. Sets endTime and status to "complete".
// Fails if no active session exists.
endSession(sessionId: string): Promise<Session>

// Get the currently active session, or null if none.
getActiveSession(): Promise<Session | null>

// List completed sessions in reverse chronological order.
// Returns paginated results.
listSessions(options: {
  limit: number    // default 20
  offset: number   // default 0
}): Promise<Session[]>

// Get a single session with all its sets.
getSessionDetail(sessionId: string): Promise<SessionDetail>
```

## Set Service

```typescript
// Log a new set within a session. setNumber is auto-assigned.
// Persists to SQLite before returning.
logSet(input: {
  sessionId: string
  exerciseId: string
  weight: number      // >= 0
  reps: number        // >= 1
  rir?: number        // 0-10, optional
}): Promise<Set>

// Edit an existing set (any session, active or completed).
updateSet(setId: string, input: {
  weight?: number
  reps?: number
  rir?: number | null
}): Promise<Set>

// Delete a set. Remaining sets for the same exercise in the
// same session are renumbered.
deleteSet(setId: string): Promise<void>

// Get the most recent set for an exercise (for pre-fill).
// Returns null if the exercise has never been logged.
getLastSetForExercise(exerciseId: string): Promise<Set | null>
```

## Exercise Service

```typescript
// List exercises, optionally filtered.
listExercises(options?: {
  muscleGroup?: string
  searchQuery?: string
  favoritesOnly?: boolean
}): Promise<Exercise[]>

// Get recently used exercises (last 10 distinct exercises logged).
getRecentExercises(): Promise<Exercise[]>

// Create a custom exercise.
createExercise(input: {
  name: string
  muscleGroup: string
}): Promise<Exercise>

// Toggle favorite status.
toggleFavorite(exerciseId: string): Promise<Exercise>
```

## Types

```typescript
interface Session {
  id: string
  startTime: string    // ISO 8601
  endTime: string | null
  status: 'active' | 'complete'
}

interface SessionDetail extends Session {
  sets: Set[]
  summary: {
    totalSets: number
    totalVolume: number   // weight * reps summed
    duration: number      // minutes
    exerciseCount: number
  }
}

interface Set {
  id: string
  sessionId: string
  exerciseId: string
  setNumber: number
  weight: number
  reps: number
  rir: number | null
  timestamp: string      // ISO 8601
}

interface Exercise {
  id: string
  name: string
  muscleGroup: string
  isBuiltIn: boolean
  isFavorite: boolean
}
```
