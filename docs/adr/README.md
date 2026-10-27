# Architecture Decision Records

| #                                        | Decision                                                                | Status   | Score          |
| ---------------------------------------- | ----------------------------------------------------------------------- | -------- | -------------- |
| [0001](0001-modular-monolith.md)         | Modular monolith on Next.js                                             | Accepted | 98             |
| [0002](0002-postgresql.md)               | PostgreSQL as primary database                                          | Accepted | 99             |
| [0003](0003-drizzle-orm.md)              | Drizzle ORM with versioned SQL migrations                               | Accepted | 98             |
| [0004](0004-staff-vs-customers.md)       | Separate staff users and customers                                      | Accepted | 99             |
| [0005](0005-rbac.md)                     | Permission-based RBAC scoped by branch                                  | Accepted | 98             |
| [0006](0006-money-bigint-irr.md)         | Money as BIGINT in Rial                                                 | Accepted | 99             |
| [0007](0007-realtime-sse.md)             | SSE + Postgres LISTEN/NOTIFY for realtime                               | Accepted | 98             |
| [0008](0008-self-host-iran.md)           | Fully self-hosted in Iran with Docker                                   | Accepted | 98             |
| [0009](0009-outbox-sync.md)              | Transactional outbox for 3rd-party sync                                 | Accepted | 98             |
| [0010](0010-payment-sep.md)              | Saman Kish (SEP) behind a PaymentGateway adapter                        | Proposed | 96             |
| [0011](0011-sync-sepidz-rahkaran.md)     | Sync with Sepidz (ordering) and Rahkaran (finance)                      | Proposed | 85             |
| [0012](0012-fonts.md)                    | Typography: Peyda headlines, Vazirmatn body                             | Accepted | 98             |
| [0013](0013-object-storage-seaweedfs.md) | S3-compatible object storage for local development and CI — SeaweedFS   | Proposed | 98 (round 3)   |
| [0014](0014-toolchain-baseline.md)       | Toolchain baseline — versions, runtime and Next.js 16 conventions       | Proposed | 98 (round 3)   |
| [0015](0015-rule-enforcement.md)         | Enforce the engineering rules with tooling, proven by tests             | Proposed | 98 (round 3)   |
| [0016](0016-supply-chain-controls.md)    | Supply-chain controls for dependencies, CI and images                   | Proposed | 99 (round 3)   |
| [0017](0017-font-delivery.md)            | Font delivery — vendored static subsets, no metric fallback, Peyda slot | Proposed | 98 (round 3)   |
| [0018](0018-not-found-handling.md)       | Not-found handling — localized 404s that are never cached               | Proposed | pending review |

An ADR below 98 stays `Proposed`; its "Revisit when" lists what is needed to reach 98. ADRs 0013–0017
reached 98 or more in the round-3 review and stay `Proposed` until the product owner accepts them;
ADR 0013 also replaces MinIO, which `docs/phases/phase-00.md` still names.
