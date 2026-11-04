# Response to Phase 0 reviews, round 9 — the closing review (code 98.5/100, security Pass)

- Scorecards: [`foundation-round-9.md`](foundation-round-9.md) (code review, at `b3325eb`) and
  [`security-foundation-round-9.md`](security-foundation-round-9.md) (security review, Gate Pass:
  0 Critical, 0 High).
- This is the closing `/review` of Phase 0 (`.claude/commands/review.md` step 4): the code
  scores 98.5, at or above the gate, with no High or Critical finding, on the final head of the
  branch, and CI run `41710963646` is green on all six jobs there. PRs 0.1–0.4 are ticked in
  `docs/phases/phase-00.md`, and the branch is ready to merge once the owner has added the
  `main` ruleset (N3).
- The gate has now been met at four consecutive heads (`cca6266`, `32b3887`, `1898889`,
  `b3325eb`). Every remaining finding is Low or Info and needs a code change, which would
  re-open the reviewed state, so none is fixed on this branch. Each is tracked instead.

## Residual findings, and where each is tracked

| Finding                                           | Severity     | Tracked                                                                                                |
| ------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| T17 / Q1 — rename detection                       | −0.25 / Low  | Register row "Secret-scan follow-ups (round 9)", first PR after the merge                              |
| T18 / Q2 — `ident`, `export-subst`                | −0.25 / Info | Same row                                                                                               |
| D7-r9 / Q4 — wording those two make untrue        | −0.25 / Info | Same row (ADR 0016, README, CHANGELOG, `ci.yml`), and corrections in the next response                 |
| Required fix 4 / Q3 — lint shapes                 | none / Info  | Register row "Raw-HTML lint follow-ups (round 9)"; Trusted Types in Phase 2 covers them                |
| Q5 — Moderate `minimatch` advisory in dev tooling | Info         | The dev audit gate is High-only by design; Dependabot proposes the bump once it runs from `main` (F10) |
| D1, D2 — history                                  | −0.75        | **Open:** the owner's approval for a force-push, or a written waiver                                   |

ADR scores at `b3325eb`, written into each ADR's header and the ADR index: 0013 99, 0014 100,
0015 100, 0016 98, 0017 100, 0018 100. ADR 0016's two points are the T17/T18 wording above.

The count the code review flags is noted here rather than rewritten in history: the
`9ac9fb1` body's "676 paths of 637 blobs" is the count at its parent; at the commit itself it is
678 of 639.

## Owner decisions before and after the merge

1. D1 and D2: approve a force-push to this branch, or record a written waiver.
2. N3: add the `main` ruleset before the first merge (six required checks, pull request
   required, merge commits and squash merges allowed, rebase merges not, no bypass).
3. N6: decide the repository's visibility (it is public today).
4. Accept ADR 0013, or amend `docs/phases/phase-00.md`, whose PR 0.2 still names MinIO.
5. After the merge: Dependabot security updates and GitHub's non-provider secret patterns
   (G1, F10), and the plan §11 questions that keep ADRs 0010 and 0011 `Proposed`.

## Owner decisions after the closing review (2026-11-04)

1. D1 and D2: the force-push was approved and done, so the D1/D2 row above is closed.
   [`history-rewrite.md`](history-rewrite.md) lists what changed and maps every old commit to
   its new one.
2. N3: the owner chose to merge Phase 0 before adding the `main` ruleset, which is the next step
   (register row "Branch protection on `main`").
3. N6: the repository stays public for now. Licensed Peyda files and real data are still never
   committed (register row "Repository visibility").
4. ADR 0013 is accepted. `docs/phases/phase-00.md` PR 0.2 now names SeaweedFS, and phases 3 and
   5 name S3-compatible storage.
5. Unchanged, after the merge: decision 5 above.
