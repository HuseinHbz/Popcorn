---
description: Execute the next unchecked PR of a phase (e.g. /phase 04)
argument-hint: <phase number, e.g. 04>
---

Run the next PR of phase $ARGUMENTS.

1. Read `CLAUDE.md`, `docs/phases/README.md`, `docs/phases/phase-$ARGUMENTS.md` and every ADR it references.
2. Pick the first unchecked PR. If its prerequisite from the restaurant is missing, add it under "Blocked" in the phase file, stop, and tell me what is missing.
3. Use the `pm-analyst` agent to write or update the stories for this PR in `docs/stories/`.
4. Enter plan mode. Use the `architect` agent to produce: files to touch, schema/migration changes, tests to write, risks. Wait for my approval.
5. Create branch `phase-$ARGUMENTS/<pr-number>-<slug>`.
6. Implement test-first: domain tests, then code, then UI. Use `backend-engineer` / `frontend-engineer` for their areas.
7. Use `qa-engineer` to add E2E and axe checks for every acceptance criterion.
8. Run `pnpm verify` until green. Do not weaken a test or a lint rule to make it pass.
9. Update `CHANGELOG.md` and any doc the change affects. New decision → new ADR.
10. Commit with Conventional Commits. Then tell me to start a fresh session and run `/review`.

Do not mark the PR as done yourself. Only `/review` with a score ≥ 98 allows ticking it.
