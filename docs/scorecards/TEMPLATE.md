# Scorecard — <phase> / <PR or deliverable>

- Reviewer: code-reviewer (fresh session)
- Date: YYYY-MM-DD
- Verdict: Approved (≥ 98) | Changes requested

## Mandatory gates (any red = score 0)

- [ ] CI green (lint, typecheck, test, build)
- [ ] 0 High/Critical security findings
- [ ] axe: 0 violations

## Code rubric

| Criterion                  | Weight  | Score | Evidence / deductions |
| -------------------------- | ------- | ----- | --------------------- |
| Type safety                | 10      |       |                       |
| Lint & format              | 10      |       |                       |
| Tests                      | 20      |       |                       |
| Security                   | 20      |       |                       |
| Architecture & readability | 20      |       |                       |
| Performance                | 10      |       |                       |
| Documentation              | 10      |       |                       |
| **Total**                  | **100** |       |                       |

## Required fixes (file:line → fix)

1.
