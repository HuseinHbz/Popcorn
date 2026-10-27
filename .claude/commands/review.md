---
description: Independent review and score of the current branch (run in a fresh session)
---

You did not write this code. Review the current branch against `main` as an independent reviewer.

1. Use the `security-reviewer` agent. Write `docs/scorecards/<phase>/security-<pr>.md`.
2. Use the `code-reviewer` agent with the rubric in `docs/project-plan.md` §3 and `docs/scorecards/TEMPLATE.md`. Write `docs/scorecards/<phase>/<pr>.md`.
3. Any mandatory gate red → score 0. Do not round up. Every deduction needs file:line and the exact fix.
4. Score ≥ 98 and no High/Critical: tick the PR in `docs/phases/phase-<phase>.md`, commit the scorecards, and tell me it is ready to merge.
5. Score < 98: list the required fixes in order and stop. Do not fix them in this session.
