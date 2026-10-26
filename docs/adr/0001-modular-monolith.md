# ADR 0001: Modular monolith on Next.js

- Status: Accepted
- Date: 2026-10-26
- Score: 98/100 (rubric: docs/project-plan.md §3)

## Context

Two branches, three brands, small team. Public site needs SSR/ISR for SEO; admin and API share the same domain model.

## Options considered

- Microservices — independent deploys, but heavy ops cost for this scale
- Separate NestJS backend + Next.js frontend — two codebases, duplicated types
- **Chosen:** see Decision

## Decision

One Next.js App Router app with strict module boundaries (`src/modules/<name>/{domain,server,ui}`); a separate BullMQ worker process from the same codebase.

## Consequences

One deploy and one type system. Boundaries are enforced by lint rules so a module can be extracted later.

## Revisit when

A module needs independent scaling or a separate team owns it.
