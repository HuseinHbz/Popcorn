# ADR 0006: Money as BIGINT in Rial

- Status: Accepted
- Date: 2026-10-26
- Score: 99/100 (rubric: docs/project-plan.md §3)

## Context
Spec had `payed_price_unit`; Rial vs Toman ambiguity; floats cause rounding errors.

## Options considered
- DECIMAL
- Storing Toman
- **Chosen:** see Decision

## Decision
All amounts `BIGINT` IRR with `_irr` suffix; display Toman via `formatToman()`; rounding rules defined in `orders/domain`.

## Consequences
No rounding drift; PSP (SEP) also works in Rial.

## Revisit when
Multi-currency becomes a requirement.
