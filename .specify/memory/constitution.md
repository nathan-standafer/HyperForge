<!--
  Sync Impact Report
  ==================
  Version change: 0.0.0 → 1.0.0 (initial adoption)
  Modified principles: N/A (initial version)
  Added sections:
    - Core Principles (5): Mobile-First UX, Ship & Iterate,
      Data Integrity, Visual Feedback, Simplicity
    - Technical Constraints
    - Development Workflow
    - Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ no changes needed (generic)
    - .specify/templates/spec-template.md ✅ no changes needed (generic)
    - .specify/templates/tasks-template.md ✅ no changes needed (generic)
    - .specify/templates/checklist-template.md ✅ no changes needed (generic)
    - .specify/templates/commands/ ✅ no command files present
  Follow-up TODOs: none
-->

# HyperForge Constitution

## Core Principles

### I. Mobile-First UX

Every screen, interaction, and data-entry flow MUST be designed for
one-handed, in-the-gym use on a phone. Desktop or tablet layouts are
secondary and MUST NOT degrade the mobile experience.

- Touch targets MUST be large enough for sweaty, gloved hands.
- Set logging MUST be completable in ≤ 3 taps per set.
- Offline-capable: the app MUST function without a network connection
  during a workout and sync when connectivity returns.

### II. Ship & Iterate

Favor working software over exhaustive upfront design. Features ship
in small, independently deployable increments behind the priority
order defined in the spec.

- Each user story MUST be deliverable as a standalone increment that
  adds visible user value.
- Avoid speculative abstractions — build what is needed now.
- Prefer quick feedback loops: prototype → user test → refine.

### III. Data Integrity

Workout data is the user's most valuable asset. The system MUST
guarantee that recorded sets, weights, and reps are never silently
lost or corrupted.

- All writes MUST be persisted before confirming to the user.
- Conflict resolution during sync MUST preserve the most recent
  user-entered data and surface conflicts transparently.
- Schema migrations MUST be backward-compatible or provide an
  automated, tested migration path.

### IV. Visual Feedback

Progress visualization is a core feature, not an afterthought. Charts,
graphs, and progress indicators MUST clearly communicate hypertrophy
progress per muscle group on a weekly basis.

- Visualizations MUST update immediately after a set is logged.
- Color, contrast, and labeling MUST meet WCAG AA accessibility
  standards.
- The user MUST be able to see at a glance which muscle groups are
  on track and which are lagging.

### V. Simplicity

Keep the codebase, UI, and feature set as simple as possible. Every
addition MUST justify its complexity against the value it delivers.

- YAGNI: do not build features until they are explicitly required.
- Prefer flat, obvious code over clever abstractions.
- Limit third-party dependencies to those that provide substantial,
  hard-to-replicate value.

## Technical Constraints

- **Language/Runtime**: TypeScript on Node.js for backend and shared
  logic. Mobile client uses a cross-platform framework (e.g.,
  React Native or Expo) to maximize code reuse.
- **Data Storage**: Local-first with offline support; remote sync for
  backup and cross-device access.
- **API Format**: JSON over HTTPS for client-server communication.
- **Testing**: Automated tests MUST cover critical data-path logic
  (set recording, progress calculation, sync/merge). UI snapshot or
  integration tests are encouraged but not mandatory for v1.

## Development Workflow

- **Branching**: One feature branch per spec; merge to main via PR.
- **Code Review**: All PRs MUST be reviewed before merge. Reviewers
  verify compliance with this constitution.
- **Commit Discipline**: Small, focused commits. Each commit SHOULD
  leave the build in a passing state.
- **Continuous Integration**: Linting, type-checking, and automated
  tests run on every push. Merges to main MUST NOT break CI.

## Governance

This constitution is the highest-authority document for HyperForge
development decisions. When a practice conflicts with a principle
listed above, the constitution takes precedence.

- **Amendments** require: (1) a written proposal describing the
  change and rationale, (2) review and approval, and (3) a migration
  plan if existing code or workflows are affected.
- **Versioning** follows semantic versioning: MAJOR for principle
  removals or incompatible redefinitions, MINOR for new principles
  or material expansions, PATCH for clarifications and typo fixes.
- **Compliance** is verified during code review; reviewers MUST flag
  violations of any principle.

**Version**: 1.0.0 | **Ratified**: 2026-04-15 | **Last Amended**: 2026-04-15
