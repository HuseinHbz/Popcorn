# ADR 0008: Fully self-hosted in Iran with Docker

- Status: Accepted
- Date: 2026-10-26
- Score: 98/100 (rubric: docs/project-plan.md §3)
- Amended by: [ADR 0013](0013-object-storage-seaweedfs.md) — MinIO images are discontinued; local S3 is SeaweedFS

## Context

Foreign PaaS and CDNs (Vercel, Google Fonts, Google Maps) are unreliable from Iran; PSP and SMS are domestic.

## Options considered

- Vercel
- Mixed foreign SaaS
- **Chosen:** see Decision

## Decision

Docker Compose on Iranian infrastructure: Nginx, app, worker, Postgres, Redis, MinIO, GlitchTip, Uptime Kuma. Local npm and Docker registry mirrors for CI.

## Consequences

Full control and low latency; we own backups, patching and monitoring (runbooks required).

## Revisit when

A reliable managed platform becomes available domestically.
