# Data Model: Workout Logging

## Entities

### Exercise

Represents a named movement pattern with muscle group classification.

| Field       | Type    | Constraints                          |
|-------------|---------|--------------------------------------|
| id          | string  | Primary key, UUID                    |
| name        | string  | Required, unique, max 100 chars      |
| muscleGroup | string  | Required, from predefined enum       |
| isBuiltIn   | boolean | true for default exercises, false for user-created |
| isFavorite  | boolean | Default false; user-togglable        |
| createdAt   | string  | ISO 8601 timestamp                   |

**Muscle Group Enum**: chest, back, shoulders, biceps, triceps, quads,
hamstrings, glutes, calves, core, forearms, full_body

**Validation**:
- Name MUST be non-empty and unique (case-insensitive).
- Muscle group MUST be a valid enum value.

### Session

Represents a time-bounded workout event.

| Field     | Type    | Constraints                            |
|-----------|---------|----------------------------------------|
| id        | string  | Primary key, UUID                      |
| startTime | string  | Required, ISO 8601 timestamp           |
| endTime   | string  | Null while active, set on completion   |
| status    | string  | "active" or "complete"                 |
| createdAt | string  | ISO 8601 timestamp                     |

**State Transitions**:
- Created → active (on "Start Workout")
- active → complete (on "End Workout")
- complete → complete (edits allowed but status stays complete)

**Validation**:
- Only one session may have status "active" at any time.
- endTime MUST be after startTime.

### Set

Represents a single logged performance record.

| Field      | Type    | Constraints                           |
|------------|---------|---------------------------------------|
| id         | string  | Primary key, UUID                     |
| sessionId  | string  | Foreign key → Session.id, required    |
| exerciseId | string  | Foreign key → Exercise.id, required   |
| setNumber  | integer | Auto-incremented per exercise within session, ≥ 1 |
| weight     | number  | Required, ≥ 0 (0 = bodyweight)        |
| reps       | integer | Required, ≥ 1                         |
| rir        | integer | Optional, 0-10 (null if not provided) |
| timestamp  | string  | Required, ISO 8601 timestamp          |
| createdAt  | string  | ISO 8601 timestamp                    |
| updatedAt  | string  | ISO 8601 timestamp, updated on edit   |

**Validation**:
- weight ≥ 0 (0 indicates bodyweight exercise).
- reps ≥ 1.
- rir, if provided, MUST be 0-10 inclusive.
- setNumber is computed: count of existing sets for the same
  (sessionId, exerciseId) pair + 1. On deletion, remaining sets
  are renumbered.

## Relationships

```text
Session 1──* Set *──1 Exercise

- A Session contains zero or more Sets.
- A Set belongs to exactly one Session and one Exercise.
- An Exercise can appear in many Sets across many Sessions.
```

## Indexes

- Session: (status) — fast lookup of active session.
- Set: (sessionId) — all sets for a session.
- Set: (exerciseId, timestamp DESC) — last performance lookup for
  pre-fill.

## Schema Migration Strategy

- v1 starts with initial schema creation (no prior data).
- Future migrations MUST use versioned migration files with forward-
  only application, per constitution Data Integrity principle.
- Schema version tracked in a `_migrations` table.
