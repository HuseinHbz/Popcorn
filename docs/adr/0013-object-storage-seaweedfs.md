# ADR 0013: S3-compatible object storage for local development and CI — SeaweedFS

- Status: Proposed
- Date: 2026-10-27
- Score: pending independent review (rubric: docs/project-plan.md §3)
- Amends: ADR 0008 (MinIO in the service list)

## Context

The platform stores menu photos (60+ originals, resized to AVIF/WebP, plan §5) and private
résumé PDFs (plan §7: private bucket, short-lived links). ADR 0008 and plan §5 name MinIO.
In Phase 0 the image could not be pulled: `docker pull minio/minio` fails with "repository does
not exist", because MinIO stopped publishing community images and its community edition is
source-only and in maintenance mode.

Constraints:

- Must speak the S3 API (presigned GET/PUT, private buckets), because the app talks to storage
  only through an S3 client configured by `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`.
- Must start with one `docker compose up` for every developer and in CI, with no bootstrap scripts.
- Must reject anonymous access, so local behaviour matches production.
- Must run on Iranian infrastructure (ADR 0008). Images are pulled through a local registry
  mirror, and nothing may depend on a foreign SaaS at runtime.
- Licence must not impose obligations on the restaurant's proprietary code.

## Options considered

| Option                                                 | Pros                                                                                                                                                                                     | Cons                                                                                                                                                                |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. MinIO built from source** into our own image      | Same name and API as the plan                                                                                                                                                            | We would own building, patching and CVE tracking for an upstream that no longer ships images. Community edition is in maintenance. AGPL-3.0.                        |
| **B. Garage** (AGPL-3.0, Rust)                         | Light; designed for self-hosted, geo-distributed clusters                                                                                                                                | Needs a config file plus a `garage layout assign/apply` bootstrap before the first bucket, so it is not one-command. AGPL. Smaller S3 surface (no bucket policies). |
| **C. SeaweedFS `weed mini`** (Apache-2.0)              | One container runs master, volume, filer and S3 gateway. Credentials come from env. `-bucket` pre-creates the bucket. Anonymous requests return 403. Actively released (4.51, Oct 2026). | S3 coverage is narrower than AWS (no object lock, partial lifecycle rules). It is a second technology for the team to learn.                                        |
| **D. Domestic cloud object storage** (e.g. ArvanCloud) | Managed, no ops                                                                                                                                                                          | Not available offline or in CI. Adds a vendor account to local development. Remains a candidate for production.                                                     |

## Decision

Local development and CI use **SeaweedFS `chrislusf/seaweedfs:4.51`** (pinned by digest in
`compose.yaml`), started as `weed mini -dir=/data -bucket=popcorn-media`. It listens on
`127.0.0.1:8333` and takes credentials from `.env`. CI asserts that anonymous access returns 403.

Application code may only use S3 operations that every candidate backend supports: put/get/delete
object, presigned GET/PUT, and private buckets. No vendor-specific API is allowed.

Production storage is **not** decided here. Phase 5 chooses between a self-hosted SeaweedFS
cluster and domestic cloud storage, using the same S3 contract.

## Consequences

- **Cost:** none. One extra container (about 100 MB RAM idle).
- **Risk:** a feature we need later may be missing from SeaweedFS's S3 gateway. This is mitigated
  by the contract above and by CI exercising the real gateway rather than a mock.
- **Reversibility:** high. The backend is just an endpoint plus credentials. Swapping it is a
  `compose.yaml` and `.env` change with no application change.
- **Iran fit:** Apache-2.0, a single image that a domestic registry mirror can host, and no
  runtime calls abroad.

## Revisit when

- A required S3 feature (e.g. object lock for compliance, lifecycle expiry for résumés) is not
  supported by SeaweedFS, or
- Phase 5 picks a production backend that should be mirrored locally instead, or
- SeaweedFS stops publishing images or security fixes.
