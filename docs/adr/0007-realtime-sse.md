# ADR 0007: SSE + Postgres LISTEN/NOTIFY for realtime

- Status: Accepted
- Date: 2026-10-26
- Score: 98/100 (rubric: docs/project-plan.md §3)

## Context

Kitchen board, waiter calls and customer order status need live updates for a few hundred concurrent clients.

## Options considered

- WebSocket server — extra infra
- Polling — latency and load
- **Chosen:** see Decision

## Decision

Server-Sent Events endpoints fed by LISTEN/NOTIFY; Nginx configured with buffering off for SSE routes.

## Consequences

Simple and proxy-friendly. One-way only; client actions go through Server Actions.

## Revisit when

Need for bidirectional realtime or >5k concurrent connections.
