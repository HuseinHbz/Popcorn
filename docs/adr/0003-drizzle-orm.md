# ADR 0003: Drizzle ORM with versioned SQL migrations

- Status: Accepted
- Date: 2026-10-26
- Score: 98/100 (rubric: docs/project-plan.md §3)

## Context
We rely on Postgres-specific constraints (EXCLUDE, partial indexes, generated columns).

## Options considered
- Prisma — weaker support for custom constraints, heavier runtime
- Kysely — great query builder but no schema/migration story
- **Chosen:** see Decision

## Decision
Drizzle schema per module in `schema.ts`; migrations generated then reviewed; custom SQL allowed in migrations.

## Consequences
Type-safe SQL-first access. Reviewers must read generated SQL.

## Revisit when
Drizzle stops being maintained or blocks a required feature.
