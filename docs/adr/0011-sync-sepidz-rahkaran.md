# ADR 0011: Sync with Sepidz (ordering) and Rahkaran (finance)

- Status: Proposed
- Date: 2026-10-26
- Score: 85/100 (rubric: docs/project-plan.md §3)

## Context
Restaurant uses Sepidz web ordering and Rahkaran financial software. Source of truth for menu and orders is not yet defined.

## Options considered
- Replace Sepidz entirely with this platform
- Manual export/import
- **Chosen:** see Decision

## Decision
Two adapters on top of ADR 0009: `SepidzAdapter` (menu, orders) and `RahkaranAdapter` (sales documents, invoices).

## Consequences
Integration effort unknown until API type (REST/SOAP/DB) is confirmed.

## Revisit when
To reach 98: API docs and test access for both systems + decision on source of truth for menu, prices and orders.
