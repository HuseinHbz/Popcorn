# ADR 0016: Supply-chain controls for dependencies, CI and images

- Status: Proposed
- Date: 2026-10-27
- Score: 98/100 (code review round 7, at `a3d1e29`, `docs/scorecards/phase-0/foundation-round-7.md`). Amended after round 7; re-score pending.
- Related: ADR 0008 (self-host in Iran), ADR 0014 (toolchain), `docs/security/risk-register.md`

## Context

The platform will take card payments (SEP) and hold customer personal data, so a poisoned
dependency, a hijacked CI action or a leaked secret is a direct risk to the restaurant. Phase 0
showed how controls drift without automation:

- dev tooling carried 6 High advisories;
- actions were pinned by moving tags;
- Node and pnpm fell behind security releases unnoticed (security reviews, rounds 1 and 2).

Constraints:

- Installs and image pulls go through Iranian mirrors (ADR 0008). A mirror must not be able to
  swap the bytes of a version we already locked.
- GitHub-hosted CI and Dependabot are foreign SaaS. They are usable today, but every control
  must have a self-hosted equivalent for Phase 5.
- The controls must not block routine work for days at a time.

## Options considered

| Concern           | Options                                        | Chosen and why                                                                                                                                                                                                                                       |
| ----------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Update PRs        | Dependabot · Renovate · manual                 | **Dependabot**: native to GitHub, no app to install, covers npm, actions and compose (with a cooldown). Renovate tracks more managers (`.nvmrc`, `packageManager`) but adds a third-party app. The two gaps are closed by our own checks (ADR 0014). |
| Advisory scanning | `pnpm audit` · OSV-Scanner · Snyk              | **`pnpm audit`** reads our exact lockfile with no extra binary, and `auditConfig.ignoreGhsas` ties exceptions to the risk register. OSV-Scanner is the fallback if npm's advisory API becomes unreachable from Iran.                                 |
| Static analysis   | Semgrep · CodeQL                               | **Semgrep** runs from a pinned image on any runner, including a future self-hosted one. CodeQL is tied to GitHub's hosted analysis.                                                                                                                  |
| Secret scanning   | gitleaks · TruffleHog · GitHub push protection | **gitleaks** in CI, offline and with no verification calls. GitHub push protection stays on as a second layer.                                                                                                                                       |
| New-release risk  | `minimumReleaseAge` · none · manual quarantine | **24-hour `minimumReleaseAge`** in pnpm and a 3-day Dependabot cooldown.                                                                                                                                                                             |

## Decision

- **Pins:**
  - Exact versions in `package.json`.
  - The lockfile's integrity hashes are verified on every install (`--frozen-lockfile`).
  - Actions are pinned by commit SHA. Service and CI-tool images are pinned by digest
    (`docker-compose.dev.yml`, `.github/ci-tools/compose.yaml`).
  - pnpm itself is pinned by the sha512 of its tarball in `packageManager`, and Corepack
    verifies it locally and in CI.
- **Audit gates (CI `quality`):**
  - `pnpm audit --audit-level=high`. Accepted exceptions are exactly the register's entries,
    enforced by `tests/risk-register.test.ts`.
  - A second gate requires zero High/Critical in production dependencies with no exceptions.
- **Freshness (CI `freshness`, also weekly):**
  - No accepted risk may be past its review date.
  - Node and pnpm must have no newer security release or blocking advisory (ADR 0014).
- **Install hygiene:**
  - `strictDepBuilds`: unapproved install scripts fail the install.
  - `minimumReleaseAge: 1440` (24 hours). A 3-day window was tried first, but pnpm applies it to
    already-locked versions too, so it blocked routine changes.
  - Escape hatch for an urgent security patch: add the package to `minimumReleaseAgeExclude` in
    `pnpm-workspace.yaml` in the same PR, with a link to the advisory.
- **Scanning:**
  - Semgrep (TypeScript, React, Next.js and secrets packs) and gitleaks run on every push.
  - gitleaks scans twice:
    - the full history, read-only, including merge diffs and type changes (`-m`, and a
      `--diff-filter` without `t`); the `.gitleaksignore` exceptions apply here;
    - the tree exported from HEAD, with no exceptions, so neither an exception nor the new
      commit ids of a squash or rebase merge can leave a secret-like value in the tree. The
      exported `.gitleaksignore` is removed before the scan, and the tree may hold no symbolic
      link (gitleaks does not follow one) and no file where the canary goes. Its rules are
      read from inside the tree, and a canary token generated at run time must be its only
      finding, so a missing or empty tree, or rules that match nothing, fail the step.
  - Semgrep scans the same exported tree with a pinned ignore file
    (`.github/ci-tools/semgrepignore`, only `tests/fixtures/`) in place of its built-in list,
    which skipped every `tests/`, `build/`, `dist/` and `vendor/` directory. It reads files of
    any size (the default skips files over 1 MB). Its report must list files from `src/` and
    `tests/` and hold no error, so a file it timed out on fails the step.
  - What keeps the scanned code from weakening the scans (each checked by a negative control
    when it was added):
    - gitleaks runs with a pinned configuration (`.github/ci-tools/gitleaks.toml`, the built-in
      rules only) and ignores inline allow comments (`--ignore-gitleaks-allow`);
    - Semgrep ignores inline suppression markers (`--disable-nosem`);
    - `.git/info/attributes` (`* !diff`, `* !export-ignore`, `* !working-tree-encoding`)
      outranks every `.gitattributes`, so no line there can hide a file from either scan or
      export it as UTF-16;
    - `scripts/check-scan-coverage.ts` reads every blob any commit on any ref ever added, under
      every path, merges included, with names as they are (non-ASCII and quoted ones too).
      Binary content (a UTF-16 text file is binary to git, and gitleaks cannot read it) must be
      an expected format (woff2, png, jpeg, gif, webp, avif, ico) and start with that format's
      signature. A text file on gitleaks' built-in path allowlist (an `.svg`, a `.pdf`, a file
      named `gitleaks.toml`, `node_modules/`, …) must be one of three expected files (the pinned
      configuration, `pnpm-lock.yaml`, `src/app/icon.svg`). The allowlist is copied from the
      pinned gitleaks version, and a test fails when the versions differ;
    - CI fails on a `.gitleaks.toml` or `.semgrepignore` at any depth, and on an inline marker in
      any commit outside the review scorecards and `ci.yml` (whose old versions name the
      markers); in the scorecards, only the two security reviews that report on markers may
      quote one. This is defence in depth: neither scanner honours a marker anywhere.

    The only exceptions are `.gitleaksignore` fingerprints, each with a reason;
    `tests/gitleaksignore.test.ts` fails on an entry that is not a fingerprint or has no reason of
    its own. An entry still lives in the repository it exempts, so a push can exempt its own
    finding: the entry shows in the diff, which the owner reads before merging.

  - `.github/CODEOWNERS` routes every path to the owner (a catch-all) and names the paths that
    hold a control: CI, scanner exceptions and attributes, dependency and runtime pins, lint
    rules and the tests and configuration behind every gate, agent and reviewer instructions,
    security headers, the proxy and the locale header's readers, start-up validation, the local
    services, the ADRs, the risk register and the scorecards. With one maintainer, who also
    authors every pull request, GitHub requests no review, so until a second maintainer exists
    the control is the owner reading the diff before merging; the ruleset then requires
    code-owner review (risk register).
  - Dependabot covers npm, GitHub Actions and both compose files, after a 3-day cooldown.

## Consequences

- **Cost:** about 2 minutes of CI per push, and a few Dependabot PRs a week.
- **Risk:**
  - The 24-hour window also delays a genuine security fix by up to a day unless the escape hatch
    is used.
  - The cooldown means Dependabot proposes a fix 3 days after release. `pnpm audit` still flags
    the vulnerable version immediately, so the gap is in the fix proposal, not in detection.
  - gitleaks matches secrets by regex and entropy, and Semgrep by pattern rules, so both can
    produce false positives. In the history they are handled with a `.gitleaksignore`
    fingerprint and a written reason, never by disabling the scan. The tree scan has no
    exceptions, so a value that looks like a secret cannot stay in the tree as text: tests
    build such values at run time.
  - Known gaps:
    - a secret inside an expected binary file (an image's metadata, say), which neither
      scanner reads, or split or encoded so that no rule matches it;
    - the three expected files gitleaks skips by name;
    - gitleaks v8.30.1's built-in allowlist regex `(?i)^true|false|null$` binds as three
      alternatives, so a secret containing "false", or starting with "true" or ending with
      "null", is dropped (security review round 7, K7). Rare for a random token, trivial on
      purpose; the owner's diff reading is the control until upstream fixes it.
  - The skipped-path list is a copy: a gitleaks image update needs a fresh copy, and the
    version test fails until it is made.
- **Reversibility:** high. Every control is one config entry or one CI step.
- **Iran fit:**
  - Hash and digest pins make a compromised mirror detectable, because the bytes must match.
  - `minimumReleaseAge` only delays adopting a newly published malicious version; it detects
    nothing. That is why it sits alongside audits, not instead of them.
  - For self-hosted CI (Phase 5), these must be mirrored or replaced:
    - Semgrep rule packs (from semgrep.dev, or vendored into `.semgrep/`);
    - the npm advisory API (OSV-Scanner with an offline database as fallback);
    - the gitleaks and Semgrep images (internal registry, or a `docker save` tarball);
    - Dependabot (Renovate self-hosted).

## Revisit when

- a security patch is blocked by the release-age window twice in a quarter (shorten it or
  automate the exclude), or
- the npm advisory API or semgrep.dev becomes unreachable from the CI network, or
- CI moves to self-hosted runners (Phase 5): replace each foreign service as listed above.
