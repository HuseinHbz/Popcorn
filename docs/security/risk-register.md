# Security risk register

Accepted risks with an owner, a reason and an expiry. An expired entry fails review until it is
re-justified or fixed. The CI audit gate (`pnpm audit --audit-level=high`) ignores exactly the
advisories listed here via `pnpm.auditConfig.ignoreGhsas` in `package.json`.

| ID    | Advisory            | Package (path)                                                                        | Severity | Why accepted                                                                                                                                            | Mitigation                                                                | Owner  | Review by  |
| ----- | ------------------- | ------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------ | ---------- |
| R-001 | GHSA-jmr9-qjv8-65gv | `extract-zip` 2.0.1 (`@lhci/cli › lighthouse › puppeteer-core › @puppeteer/browsers`) | High     | No patched release exists. Dev-only; the code path downloads a browser archive, which Lighthouse CI never does (it uses the installed Chrome).          | Dev/CI only; not in the production bundle (`pnpm audit --prod` is clean). | devops | 2027-01-31 |
| R-002 | GHSA-7pqw-9j4j-h8q3 | `extract-zip` 2.0.1 (same path)                                                       | High     | Same as R-001.                                                                                                                                          | Same as R-001.                                                            | devops | 2027-01-31 |
| R-003 | GHSA-mrhx-c7xc-m3w5 | `zod` 3.25.76 (`@lhci/cli › lighthouse › puppeteer-core › chromium-bidi`)             | High     | Fixed only in zod ≥ 4.6.6; chromium-bidi requires zod 3. Used only for WebDriver BiDi, which Lighthouse CI does not use; input is our own local Chrome. | Dev/CI only. The app has no direct `zod` dependency yet.                  | devops | 2027-01-31 |

## Resolved by overrides

`package.json › pnpm.overrides` lifts these transitive dev dependencies of `@lhci/cli` to patched
versions; `pnpm lhci` was re-run and passes with them:
`tmp` → 0.2.7 (GHSA-ph9p-34f9-6g65, GHSA-52f5-9888-hmc6), `basic-ftp` → 6.2.3 (GHSA-c475-qrg2-pj4r),
`uuid` → 11.1.1 (GHSA-w5hq-g745-h8pq).

## Deferred controls (tracked, not accepted)

| Control                                             | Current state                                   | Must land by                                                                                                                                    |
| --------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Nonce-based CSP without `'unsafe-inline'` (plan §7) | Baseline CSP with `'unsafe-inline'` for scripts | Phase 2, before any staff-, CMS- or customer-supplied content is rendered. The nonce must also cover `/t/*` (outside the locale proxy matcher). |
| HSTS `includeSubDomains`                            | Sent by the app                                 | Confirm every production subdomain serves HTTPS before go-live (Phase 5).                                                                       |
