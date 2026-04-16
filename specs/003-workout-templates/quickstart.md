# Quickstart: Workout Templates & Programs

## Prerequisites

- Features 001 (workout logging) and 002 (progress tracking) merged.
- Expo dev environment set up (`npm install`, `npx expo start`).
- No new dependencies to install (uses existing expo-sqlite,
  expo-router, react-native-gesture-handler).

## Build Order (matches user-story priorities)

### P1 — Template CRUD

1. Write migration `src/db/migrations/002-templates.ts` and register
   in `src/db/database.ts`.
2. Create models: `src/models/template.ts`, `src/models/program.ts`,
   `src/models/session-target.ts`.
3. Implement `src/services/template-service.ts` with unit tests.
4. Build `TemplateCard`, `TemplateExerciseRow`, `TemplateForm`
   components.
5. Wire up routes: `templates/index.tsx`, `templates/create.tsx`,
   `templates/[id].tsx`.
6. Add "Templates" tab to `_layout.tsx`.
7. Manual test: create a template, add exercises, reorder, save,
   edit, delete.

### P2 — Start Session From Template

1. Implement `src/services/session-template-service.ts` with unit
   tests.
2. Build `TemplateSessionView` component.
3. Add "Start Workout" action to template detail page.
4. Integrate `TemplateSessionView` into the home screen's active
   session flow, showing pre-loaded targets alongside the existing
   `SetLogForm`.
5. Manual test: start from template, log sets with pre-filled values,
   adjust a value, add an extra exercise, force-close and reopen.

### P3 — Programs

1. Implement `src/services/program-service.ts` with unit tests.
2. Build `ProgramForm`, `ProgramDayRow`, `SuggestionCard`.
3. Wire up routes: `programs/index.tsx`, `programs/create.tsx`,
   `programs/[id].tsx`.
4. Integrate `SuggestionCard` into the home screen (no-active-session
   state).
5. Manual test: create a program, assign templates to days, activate,
   verify today's suggestion, start from suggestion, verify
   completed state.

## Offline Verification

For each increment:
1. Put device in airplane mode.
2. Create/edit/delete templates and programs.
3. Start a session from a template.
4. Verify suggestion card appears.

## Running Tests

```sh
npm test && npm run lint
```

## Definition of Done (per story)

- Unit tests for new services pass.
- Manual mobile test on device/simulator.
- Airplane-mode verification passes.
- Feature 001 set-logging and feature 002 progress tracking still
  work for template-started sessions.
- `npm run lint` clean.
