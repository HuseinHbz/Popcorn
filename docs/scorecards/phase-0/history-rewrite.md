# Phase 0 history rewrite (D1, D2)

- The product owner approved a force-push to `chore/phase-0-foundation` on 2026-11-04, before
  the first merge to `main`, which settles the D1 and D2 deductions of the round 2–9 code reviews.
- Before: `8af0dc7`, 176 commits on `main` (`049877d`). After: `4406f08`, 187 commits. Authors,
  committers and dates are unchanged, and every commit is signed again.
- The two heads' trees differ only in the commit SHAs quoted in 33 files. Every file keeps its
  size, and mapping the new SHAs back gives the old bytes.

## What changed

- **D1.** The Prettier reformat of `docs/project-plan.md` moved out of `c2d2e84` (now `fb2b628`)
  into `a60909d` (now `fc36788`), the `style(docs)` commit that formats the other existing docs,
  as the round-2 review asked. The five commits in between hold the plan as the maintainer
  wrote it.
- **D2, mixed concerns.** `d0d1e50`, `a701e1f`, `3441445`, `7e101c2`, `5af3007` and `c25ba2d` are
  split into 17 commits, one concern each, listed in the table. The last part of each has the
  original commit's tree. At every part, and at each original commit and its parent, `tsc`,
  Vitest and ESLint pass (run with today's dependencies).
- **D2, a commit failing its own gate.** `41fd08f`'s marker pattern, which skips flag names, is
  folded into `ff9ea59` (now `74957fe`) and the three commits after it. Each commit's own guard
  step, run at that commit with the shell Actions uses, failed on the old `ff9ea59`; it passes
  on all 187 new commits. At `74957fe`, a nested `.semgrepignore`, an upper-case long marker and
  a short marker still fail it. `41fd08f` (now `4b4a0ce`) keeps only the scorecard check.
- **Commit messages.** The bodies of `97f373f` (now `7402e7c`) and `86a4095` (now `7821a5d`) had
  a line that commitlint read as a footer. Both are reworded, and commitlint reports no problem
  and no warning on the branch.

## Commit SHAs in documents

- A SHA quoted in a document or in a commit message now names the new commit, at the same
  length. Both `.gitleaksignore` fingerprints name the new commits, with the same file and line.
- The nine commits whose own change was rewritten keep their old SHAs: `c2d2e84`, `d0d1e50`,
  `a701e1f`, `3441445`, `7e101c2`, `5af3007`, `c25ba2d`, `ff9ea59` and `41fd08f`. Apart from this
  record, only round 1–9 scorecards and responses name them, and those describe the commits as
  they were. The table gives their replacements.
- The CI runs quoted in the scorecards ran on the old SHAs; the table maps each one. Counts
  measured before the rewrite (commits in a range, paths and blobs checked) describe the old
  history.

## Old and new commits

| Old       | New                                        | Subject before the rewrite                                                           |
| --------- | ------------------------------------------ | ------------------------------------------------------------------------------------ |
| `c2d2e84` | `fb2b628`                                  | build: set up pnpm project, strict TypeScript and Next.js 16 config                  |
| `1276a70` | `a08892a`                                  | feat(i18n): add fa/en locale routing and bilingual RTL hello page                    |
| `530fa9a` | `e94b56e`                                  | chore: enforce lint, format and commit conventions                                   |
| `f24ce4a` | `bc0478c`                                  | test: add Vitest, Playwright E2E with axe and Lighthouse CI gates                    |
| `36ba2bc` | `cd120c3`                                  | build(docker): add local Postgres, Redis and S3 storage services                     |
| `c193273` | `d8979d4`                                  | ci: add GitHub Actions pipeline                                                      |
| `a60909d` | `fc36788`                                  | style(docs): apply Prettier formatting to existing docs                              |
| `d6d7799` | `481899c`                                  | docs: add Phase 0 story, ADRs 0013-0014, setup guide and changelog                   |
| `f5a89f5` | `5513d21`                                  | fix(ci): generate route types before lint; drop engine-strict                        |
| `d0d1e50` | `67f7eb7`, `72f13fa`                       | fix(security): harden headers and tighten the locale proxy matcher                   |
| `4c6faef` | `88bba7e`                                  | build(docker): add least-privilege app role and pin images by digest                 |
| `0048af0` | `3a75b98`                                  | build(deps): patch lhci transitive advisories and require release age                |
| `5da71dc` | `3159a63`                                  | ci: pin actions by SHA and add audit, secret-scan and auth checks                    |
| `5d0dcdd` | `2b5ddb3`                                  | docs(security): add risk register and extend Phase 0 acceptance criteria             |
| `dbe483c` | `ea3043d`                                  | fix(ci): check Postgres auth over the compose network                                |
| `a3b4d28` | `ac42c8a`                                  | fix(fonts): vendor static Vazirmatn subsets and drop the Arial fallback              |
| `a701e1f` | `0b5ffb7`, `7086d43`, `939d981`            | build(deps): pin Node 22.22.1, drop unused deps, use a 24-hour release age           |
| `b39028f` | `a3ddafd`                                  | build(lint): enforce module boundaries, pure code and raw-colour bans                |
| `c3bff97` | `30b6c63`                                  | test: assert the language switch, the font stack and commit-message rules            |
| `3441445` | `7eb13a2`, `d435f78`, `872c946`, `50e254f` | ci: add Semgrep, full commit range on main, port binding and Lighthouse scores       |
| `c84a613` | `aa41f92`                                  | docs: rewrite ADRs 0013-0014, extend the story and add the Phase 0 changelog         |
| `5403203` | `bd00cc3`                                  | docs(scorecards): add Phase 0 round-1 reviews and the fix mapping                    |
| `7e101c2` | `9acd214`, `81bd602`, `346f9f2`            | build(deps): move to Node 22.23.4 and pnpm 10.34.9; strict dependency builds         |
| `f9bcbde` | `fe62b66`                                  | fix(security): bind the dev and start servers to loopback                            |
| `49c9ac7` | `e6a2b47`                                  | fix(docker): keep the Redis password out of process arguments                        |
| `3fa0437` | `ebf4b56`                                  | fix(security): deny payment, USB and Topics in Permissions-Policy                    |
| `ec2ed78` | `e63a0ea`                                  | ci: track CI tool images with Dependabot and mount the repo read-only                |
| `ac2ecc5` | `f491010`                                  | ci: fail on any High or Critical advisory in production dependencies                 |
| `5af3007` | `d8f2bcf`, `3011105`, `8563ed3`            | ci: run weekly and check Node security releases and risk-register expiry             |
| `2d18597` | `89729f1`                                  | chore(fonts): record SHA-256 checksums of the vendored fonts                         |
| `02be104` | `74a808c`                                  | docs(security): record deferred controls and the new supply-chain gates              |
| `e7248be` | `af8e2c7`                                  | docs(scorecards): add Phase 0 round-2 code (93.75) and security (Pass) reviews       |
| `49528ae` | `4cc22b0`                                  | Merge remote-tracking branch 'origin/main' into chore/phase-0-foundation             |
| `2da1db9` | `f23b076`                                  | feat: add the module skeleton with empty public entries                              |
| `473d9ab` | `bc44104`                                  | build: add pnpm verify and run it in CI                                              |
| `c25ba2d` | `e441377`, `9243f76`                       | ci: never cancel runs on main and keep the Lighthouse reports                        |
| `c38352f` | `be9f335`                                  | build(docker): rename the dev compose file to docker-compose.dev.yml                 |
| `f75c7c2` | `8579fd8`                                  | feat(config): validate the environment with Zod and refuse to start without it       |
| `48465f0` | `0f031fc`                                  | test: hold shared/config to the 90% coverage threshold                               |
| `250dd52` | `cd0fb2d`                                  | feat(lib): add toPersianDigits, formatToman and formatJalali                         |
| `aede5ff` | `9227103`                                  | feat(fonts): self-host Shippori Mincho and add the Peyda headline slot               |
| `22351bb` | `91eee49`                                  | refactor(config): move the node-only start-up check out of the instrumentation entry |
| `85a1bad` | `baf1ef2`                                  | fix(i18n): serve a localized, accessible 404 for every unknown path                  |
| `9f44244` | `3868c43`                                  | test(lint): prove the file-length and npm-package rules fire                         |
| `d633a2e` | `e701769`                                  | build(lint): ban the clock, randomness and ambient globals in pure code              |
| `9cf6be6` | `1ce2a41`                                  | build(lint): ban named colours, inline colours and Tailwind arbitrary values         |
| `74459eb` | `462a86a`                                  | build(lint): reject user-facing text that bypasses next-intl                         |
| `b205a60` | `2130be0`                                  | test(security): keep the audit exceptions and the risk register in lockstep          |
| `8cdcf8d` | `2a2de54`                                  | ci: exercise the S3 gateway with a signed PUT/GET round trip                         |
| `2e176e2` | `94438f6`                                  | ci: fail when the pinned package manager has a High or Critical advisory             |
| `f95cc71` | `2a59756`                                  | docs(adr): split ADR 0014 into toolchain, rule enforcement, supply chain and fonts   |
| `75d3fce` | `229ce74`                                  | docs(adr): complete ADR 0013 and mark the ADR 0008 amendment as proposed             |
| `7acee6e` | `b08ad50`                                  | docs(story): cover every phase-00 deliverable in the foundation acceptance criteria  |
| `a457aee` | `6eca1e5`                                  | docs: document pnpm verify, the CI gates and the risk register                       |
| `a5e5e6c` | `3dc88c8`                                  | ci(lighthouse): assert the median of the runs, not the best one                      |
| `d0cc6ec` | `40a85a4`                                  | perf(fonts): stop downloading Shippori Mincho on Persian pages                       |
| `4e14993` | `35f5cae`                                  | fix(config): require APP_ENV and harden the production environment rules             |
| `86b5af4` | `5b1aa9f`                                  | ci(freshness): fail when the release or advisory data changes shape                  |
| `2786bd1` | `7562be7`                                  | ci(freshness): fail once the pinned Node line reaches end of life                    |
| `0272217` | `a80fced`                                  | ci: give every run on main its own concurrency group                                 |
| `e3187e1` | `fde7723`                                  | test(lint): assert every fixture's findings line by line                             |
| `9022dcb` | `0ae5dc4`                                  | build(lint): catch wrapped, conditional and button-value text                        |
| `2413b4c` | `883be5f`                                  | build(lint): close the clock, randomness and I/O bypasses in pure code               |
| `2fc8925` | `5077725`                                  | build(lint): ban eval, new Function, javascript: URLs and raw HTML                   |
| `dc08667` | `203b5f7`                                  | build(lint): close the remaining colour and token bypasses in TS/TSX                 |
| `59164be` | `7d33380`                                  | refactor(i18n): define the locales and the locale fallback once                      |
| `1ec24a0` | `ea0da4c`                                  | ci(services): check every rejection AC10 names, for the right reason                 |
| `ab09db7` | `2247168`                                  | test(lib): format Toman amounts beyond 2^53 exactly in both locales                  |
| `c7c6ef5` | `2100873`                                  | fix(docker): turn off SeaweedFS telemetry and isolate its internal APIs              |
| `18c7bba` | `bce3631`                                  | fix(i18n): stop caching single-segment 404s for a year                               |
| `a1f23d0` | `e594c9c`                                  | build: pin pnpm by its tarball hash and install it with Corepack in CI               |
| `7bf2d60` | `7005c00`                                  | ci(freshness): also block Moderate advisories in the package manager                 |
| `aab98f8` | `ff5a14d`                                  | docs: correct the zod and gitleaks statements                                        |
| `76bcf96` | `5861ffb`                                  | docs(security): track app secrets, Redis ACLs, Host trust and E2E artifacts          |
| `f6eb43b` | `9853325`                                  | ci(secrets): allowlist a test value gitleaks flagged, with its reason                |
| `f29d417` | `587b921`                                  | docs(scorecards): add Phase 0 round-3 code (95.5) and security (Pass) reviews        |
| `3f1fb7a` | `3e692c2`                                  | docs(scorecards): map every round-3 finding to its fix                               |
| `2060a4a` | `487fe51`                                  | docs(adr): record the round-3 scores of ADRs 0013-0017                               |
| `26e1971` | `d44ce95`                                  | docs(changelog): record the round-3 changes                                          |
| `69d1c48` | `fe128c1`                                  | build(lint): ban raw HTML through createElement, spreads and srcDoc                  |
| `c90dce9` | `9441881`                                  | fix(config): close the pattern gaps in the production environment rules              |
| `e5714ba` | `1241617`                                  | ci(services): make the object-store isolation check prove its claim                  |
| `e7c0e5b` | `d88bd6c`                                  | ci(secrets): stop the scanned code from switching its own scan off                   |
| `86a4095` | `7821a5d`                                  | chore: route changes to the security controls to the owner                           |
| `6f730d9` | `d4c2579`                                  | docs(security): correct the object-store exposure and record Phase 5 edge rules      |
| `3e876b9` | `b852508`                                  | fix(i18n): render every 404 on the server, in the request's locale                   |
| `58a47c3` | `522aedc`                                  | build(lint): catch literal text in branches of JSX children and button values        |
| `c57262b` | `8f1f239`                                  | build(lint): check token rules in branches, SVG template literals and negatives      |
| `e84d17c` | `269f3af`                                  | test(lighthouse): pin the best-practices and SEO thresholds too                      |
| `563ed4e` | `893f904`                                  | ci(freshness): reject reshaped advisory answers and prove both checks can fail       |
| `014ea81` | `f18ed63`                                  | docs: correct the Corepack mirror advice and list CI's foreign endpoints             |
| `002ea3e` | `0960a8a`                                  | test(security): require a written reason for every gitleaks exception                |
| `442e21d` | `56c57c5`                                  | style(fonts): split two joined comment paragraphs                                    |
| `bd834c0` | `4045f40`                                  | docs(adr): record the trade-offs the round-4 review found unstated                   |
| `9f13a52` | `cbb2636`                                  | docs: describe the round-4 CI gates in the README and CHANGELOG                      |
| `6ef68e1` | `ad60853`                                  | docs(scorecards): add Phase 0 round-4 code (97.5) and security (Pass) reviews        |
| `1d1ee9a` | `b5c7631`                                  | docs(scorecards): map every round-4 finding to its fix                               |
| `e859a27` | `c693ccb`                                  | docs(adr): record the round-4 scores of ADRs 0013-0018                               |
| `859d5fa` | `b57d924`                                  | ci(secrets): allowlist the fake test value quoted in a scorecard                     |
| `fe5b81c` | `5e34f03`                                  | ci(lighthouse): print the median scores to the job log too                           |
| `97f373f` | `7402e7c`                                  | ci: run steps with pipefail and let the telemetry log check fail                     |
| `ff9ea59` | `74957fe`                                  | ci(secrets): make the scanners ignore every in-repo way to weaken them               |
| `ab43280` | `20dc985`                                  | ci(secrets): also scan the current tree, with no exceptions                          |
| `dd81d7d` | `c6073e5`                                  | fix(i18n): keep the English 404's home link in English                               |
| `d90cb29` | `107cca4`                                  | build(lint): see through as, satisfies and non-null wrappers                         |
| `41fd08f` | `4b4a0ce`                                  | ci(secrets): limit marker quotes to the two reviews that report on them              |
| `afa4177` | `7314fd6`                                  | chore: cover every security control in CODEOWNERS and say what it does today         |
| `b38e0b4` | `f2767ab`                                  | build(lint): ban srcDoc props, computed raw-HTML keys and DOM HTML sinks             |
| `c0605d3` | `8ab4215`                                  | fix(config): reject repetitive production secrets and blank passwords                |
| `042b498` | `3975b5b`                                  | docs(security): track the locale header, Node 22's end of life and GitHub settings   |
| `ad64dc0` | `4b367a1`                                  | docs(adr): record the remaining trade-offs from the round-5 review                   |
| `9214bea` | `f99fded`                                  | docs(scorecards): add Phase 0 round-5 code (97.75) and security (Pass) reviews       |
| `82dc1b3` | `8c78d20`                                  | docs(scorecards): correct two round-4 claims the round-5 reviews disproved           |
| `e0defa2` | `b537cc7`                                  | docs(scorecards): map every round-5 finding to its fix                               |
| `a2d5e28` | `cca6266`                                  | docs(adr): record the round-5 scores of ADRs 0013-0018                               |
| `15d1478` | `4cbe189`                                  | ci(services): capture command output before grep -q under pipefail                   |
| `275b403` | `541350c`                                  | ci(audit): give the production audit the threshold its check reads                   |
| `c9cb1e1` | `1f1a7b8`                                  | ci(secrets): fail the scorecard marker check when git grep fails                     |
| `687f69a` | `b0deb6a`                                  | ci(gitleaks): make the tree scan fail when there is no tree                          |
| `444faf9` | `0f1c7f4`                                  | fix(lint): ban document.write and the remaining DOM HTML sinks                       |
| `7cba218` | `36615cf`                                  | fix(lint): follow branches two levels deep in token and button-value rules           |
| `acf3507` | `79b117b`                                  | ci(services): accept exactly one object-store telemetry flag, set off                |
| `9dd30c4` | `50a4c62`                                  | ci(secrets): stop UTF-16 text from hiding from both gitleaks scans                   |
| `1b784fe` | `80c0d91`                                  | ci(gitleaks): scan merge diffs and type changes in the history                       |
| `f2791c5` | `feb60f3`                                  | ci(gitleaks): prove the tree scan read the tree, with a canary                       |
| `097d425` | `3c4a827`                                  | ci(secrets): fail on text files that gitleaks skips by name                          |
| `3e7b5c2` | `6e3b476`                                  | ci(sast): scan tests/ with Semgrep, from the exported tree                           |
| `63169e9` | `9ba554e`                                  | fix(lint): ban any string naming an HTML sink, and the shapes around it              |
| `dc8d1c0` | `f6e9590`                                  | chore(github): route every path to the owner in CODEOWNERS                           |
| `77c2960` | `aa1a76e`                                  | fix(scripts): reject a null advisory list for the package manager                    |
| `ba7a431` | `7cb360f`                                  | refactor(i18n): take locale defaults and the toggle from the locale list             |
| `a8ffbfb` | `250d920`                                  | docs(env): name the distinct-character rule in .env.example                          |
| `7f80522` | `c0078c6`                                  | ci(services): read the S3 port and bucket from .env in the S3 checks                 |
| `a01964b` | `ff6832e`                                  | ci(lighthouse): publish the median scores as annotations                             |
| `4aa7833` | `87d0362`                                  | docs(gitleaks): say that only one commit quotes the test value                       |
| `7b8e3f9` | `0e962bc`                                  | docs(scorecards): add the round-6 code and security reviews of Phase 0               |
| `3145280` | `36f6de3`                                  | docs(adr): bring ADRs 0013, 0015, 0016 and 0018 in line with the round-6 fixes       |
| `d838bbe` | `310517c`                                  | docs(adr): record the round-6 scores of ADRs 0013-0018                               |
| `2d31f1a` | `d5c7a37`                                  | docs: state what the scans enforce in README and CHANGELOG                           |
| `f1378d5` | `e46ae6b`                                  | docs(security): track the secret-scanning blind spots in the register                |
| `01d443a` | `f3acf1b`                                  | docs(scorecards): correct the round-4 and round-5 responses                          |
| `a3d1e29` | `32b3887`                                  | docs(scorecards): respond to the round-6 reviews of Phase 0                          |
| `bccdaab` | `8b7f8ed`                                  | ci(gitleaks): close the tree scan's three side doors                                 |
| `1105e1f` | `03dc9e8`                                  | ci(sast): scan files of any size and fail on Semgrep errors                          |
| `ea9c834` | `989ed21`                                  | fix(lint): apply the project rules to every source extension                         |
| `e4669af` | `0619973`                                  | test: keep JavaScript and .mts/.cts sources out of src/                              |
| `55dbfeb` | `740b9f3`                                  | build(next): route only .tsx and .ts files                                           |
| `a4066cd` | `7bf42b1`                                  | fix(lint): ban sink references, pattern writes and script bodies                     |
| `99a0a61` | `7c86861`                                  | ci(secrets): check every file in the history, not only HEAD                          |
| `4a33ca1` | `0dcb06f`                                  | docs(scorecards): add the round-7 code and security reviews of Phase 0               |
| `90f01ce` | `68072b9`                                  | docs(adr): bring ADRs 0015 and 0016 in line with the round-7 fixes                   |
| `3769a58` | `9f46fe6`                                  | docs(adr): record the round-7 scores of ADRs 0013-0018                               |
| `b73da59` | `5aab6f4`                                  | docs: describe the scans and lint scope as round 7 left them                         |
| `ee5dd2d` | `d179c1b`                                  | docs(security): update the scanning gaps and add Trusted Types to the CSP row        |
| `b8919d9` | `e4ac3d4`                                  | docs(scorecards): correct the round-6 response                                       |
| `f4a3659` | `1898889`                                  | docs(scorecards): respond to the round-7 reviews of Phase 0                          |
| `cebf59d` | `9ac9fb1`                                  | fix(scripts): judge each change against the blob git diffs it with                   |
| `c7b008f` | `f4b0723`                                  | fix(scripts): match file names as gitleaks does, and escape them in errors           |
| `ce89c46` | `b94f620`                                  | ci(gitleaks): scan the tree as a one-commit repository, not a directory              |
| `c44fbc7` | `7560323`                                  | ci(secrets): fail the coverage step when the script did not run                      |
| `26c4646` | `3a6c7ac`                                  | refactor(lint): move the raw-HTML selectors into eslint/unsafe-syntax.mjs            |
| `e3e06eb` | `0b697f3`                                  | fix(lint): ban next/script bodies, scripts made in code and execCommand by string    |
| `81cdfb7` | `7ab9118`                                  | ci(lighthouse): assert the median of 7 runs instead of 5                             |
| `fc93fd2` | `bb8bab5`                                  | docs(scorecards): add the round-8 code and security reviews of Phase 0               |
| `ab508ee` | `feffc43`                                  | docs(scripts): state the coverage check's whole contract in its header               |
| `a7775be` | `aa78d6e`                                  | docs(adr): bring ADRs 0015 and 0016 in line with the round-8 fixes                   |
| `9f888de` | `9b6fb85`                                  | docs(adr): record the round-8 scores of ADRs 0013-0018                               |
| `3f4200e` | `3d79dbc`                                  | fix(scripts): accept nodejs.org prereleases in the Node freshness check              |
| `356fbda` | `b332a63`                                  | docs(scorecards): correct the round-6 and round-7 responses                          |
| `8ec5281` | `09919c1`                                  | docs(changelog): describe the tree scan and coverage check as round 8 left them      |
| `03ba986` | `b3325eb`                                  | docs(scorecards): respond to the round-8 reviews of Phase 0                          |
| `92ab2f8` | `5239b5c`                                  | docs(scorecards): add the round-9 closing reviews of Phase 0                         |
| `79f4ed4` | `c368e73`                                  | docs(security): track the round-9 residuals as deferred controls                     |
| `b1f5f51` | `d052996`                                  | docs(adr): record the round-9 scores of ADRs 0013-0018                               |
| `a347dc7` | `b7be64d`                                  | docs(scorecards): respond to the round-9 closing reviews of Phase 0                  |
| `8af0dc7` | `4406f08`                                  | docs(phases): tick Phase 0 PRs 0.1-0.4 after the closing review                      |
