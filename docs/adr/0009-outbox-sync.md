# ADR 0009: Transactional outbox for 3rd-party sync

- Status: Accepted
- Date: 2026-10-26
- Score: 98/100 (rubric: docs/project-plan.md §3)

## Context

External systems (Sepidz, Rahkaran) can be down; orders must not be lost or duplicated.

## Options considered

- Direct API calls inside request handlers
- **Chosen:** see Decision

## Decision

Write `outbox_events` in the same transaction as the business change; BullMQ worker delivers with retry, backoff and idempotency keys; `sync_mappings` stores external IDs.

## Consequences

At-least-once delivery with idempotent consumers. Slight delay between our system and theirs.

## Revisit when

Partners offer webhooks with guaranteed delivery.
