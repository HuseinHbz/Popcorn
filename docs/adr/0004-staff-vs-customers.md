# ADR 0004: Separate staff users and customers

- Status: Accepted
- Date: 2026-10-26
- Score: 99/100 (rubric: docs/project-plan.md §3)

## Context
Original spec mixed staff and customers club in one users table.

## Options considered
- Single `users` table with a role column
- **Chosen:** see Decision

## Decision
`staff_users` (mobile + Argon2id password, RBAC, 2FA for owner) and `customers` (SMS OTP, loyalty, consent).

## Consequences
Different auth, retention and privacy rules stay clean. A staff member who is also a customer has two records.

## Revisit when
Never expected.
