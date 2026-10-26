# Architecture Decision Records

| # | Decision | Status | Score |
| --- | --- | --- | --- |
| [0001](0001-modular-monolith.md) | Modular monolith on Next.js | Accepted | 98 |
| [0002](0002-postgresql.md) | PostgreSQL as primary database | Accepted | 99 |
| [0003](0003-drizzle-orm.md) | Drizzle ORM with versioned SQL migrations | Accepted | 98 |
| [0004](0004-staff-vs-customers.md) | Separate staff users and customers | Accepted | 99 |
| [0005](0005-rbac.md) | Permission-based RBAC scoped by branch | Accepted | 98 |
| [0006](0006-money-bigint-irr.md) | Money as BIGINT in Rial | Accepted | 99 |
| [0007](0007-realtime-sse.md) | SSE + Postgres LISTEN/NOTIFY for realtime | Accepted | 98 |
| [0008](0008-self-host-iran.md) | Fully self-hosted in Iran with Docker | Accepted | 98 |
| [0009](0009-outbox-sync.md) | Transactional outbox for 3rd-party sync | Accepted | 98 |
| [0010](0010-payment-sep.md) | Saman Kish (SEP) behind a PaymentGateway adapter | Proposed | 96 |
| [0011](0011-sync-sepidz-rahkaran.md) | Sync with Sepidz (ordering) and Rahkaran (finance) | Proposed | 85 |
| [0012](0012-fonts.md) | Typography: Peyda headlines, Vazirmatn body | Accepted | 98 |

An ADR below 98 stays `Proposed`; its "Revisit when" lists what is needed to reach 98.
