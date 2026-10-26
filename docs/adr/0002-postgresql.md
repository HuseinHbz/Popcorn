# ADR 0002: PostgreSQL as primary database

- Status: Accepted
- Date: 2026-10-26
- Score: 99/100 (rubric: docs/project-plan.md §3)

## Context
Bookings must never overlap; orders, payments and loyalty need strong transactions; CMS content is semi-structured.

## Options considered
- MySQL — no exclusion constraints on ranges
- MongoDB — weak multi-document transactions for money
- **Chosen:** see Decision

## Decision
PostgreSQL with `btree_gist`; `EXCLUDE USING gist (table_id WITH =, tstzrange(starts_at, ends_at) WITH &&)` on active bookings; JSONB for CMS blocks.

## Consequences
Overlap safety lives in the database. Team must know Postgres-specific features.

## Revisit when
Never for overlap; revisit hosting if managed Postgres becomes available in Iran.
