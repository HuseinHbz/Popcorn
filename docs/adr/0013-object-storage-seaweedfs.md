# ADR 0013: S3-compatible object storage — SeaweedFS for local development

- Status: Accepted (local development) · production choice revisited in Phase 5
- Date: 2026-10-26
- Score: pending independent review (rubric: docs/project-plan.md §3)
- Amends: ADR 0008 (MinIO in the service list)

## Context

ADR 0008 and plan §5 name MinIO for S3-compatible storage (menu images, résumés). During Phase 0 the
`minio/minio` image could not be pulled: MinIO stopped publishing community images and the Docker
Hub repository no longer exists. The app only depends on the S3 API, so any S3-compatible store works.

## Options considered

- MinIO built from source into our own image — keeps the name, but upstream community edition is
  source-only and in maintenance; we would own building and patching it.
- Garage (AGPL) — light and built for self-hosting, but needs a config file plus a layout bootstrap
  step before the first bucket, which complicates `compose up`.
- **SeaweedFS (Apache-2.0)** — `weed mini` runs master, volume, filer and S3 gateway in one container,
  pre-creates the bucket and takes credentials from env; anonymous access is rejected.
- Iranian cloud object storage (e.g. ArvanCloud) — candidate for production, not for offline dev.

## Decision

Local development uses `chrislusf/seaweedfs:4.51` (`weed mini`) on `127.0.0.1:8333`, bucket
`popcorn-media`, credentials from `.env`. Application code talks to storage only through an S3 client
configured by `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, so the backend is swappable.

## Consequences

One container, no bootstrap scripts, licence without AGPL obligations. SeaweedFS's S3 coverage is
narrower than AWS; we only use basic object operations and presigned URLs, which it supports.
Production storage (self-hosted SeaweedFS cluster vs domestic cloud) is decided in Phase 5.

## Revisit when

A needed S3 feature is missing, or production picks a different backend that should be mirrored locally.
