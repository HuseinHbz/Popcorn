# ADR 0010: Saman Kish (SEP) behind a PaymentGateway adapter

- Status: Proposed
- Date: 2026-10-26
- Score: 96/100 (rubric: docs/project-plan.md §3)

## Context
Restaurant's existing PSP contract is with Saman Kish. Used for booking deposits and online QR payments.

## Options considered
- Direct SEP integration without abstraction
- Aggregator gateway (e.g. Zarinpal)
- **Chosen:** see Decision

## Decision
`PaymentGateway` interface (`initiate`, `verify`, `reverse`); SEP implementation; manual card-reader/cash payments recorded in `payments`.

## Consequences
PSP can be swapped without touching order code.

## Revisit when
To reach 98: SEP Terminal ID per branch and successful pay/verify/reverse in test environment.
