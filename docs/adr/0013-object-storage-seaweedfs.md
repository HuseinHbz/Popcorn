# ADR 0013: S3-compatible object storage for local development and CI — SeaweedFS

- Status: Proposed
- Date: 2026-10-27
- Score: 99/100 (code review round 7, at `a3d1e29`, `docs/scorecards/phase-0/foundation-round-7.md`).
- Proposes an amendment to: ADR 0008 (MinIO in the service list)

## Context

The platform stores menu photos (60+ originals, resized to AVIF/WebP, plan §5) and private
résumé PDFs (plan §7: private bucket, short-lived links). ADR 0008 and plan §5 name MinIO.

**Trigger, observed 2026-10-26 during Phase 0:**

- `docker pull minio/minio` failed with "pull access denied … repository does not exist".
- Docker Hub's API answered `object not found` for `minio/minio`.
- MinIO had stopped publishing community images, and its community edition is source-only.
- `quay.io/minio/minio` answered HTTP 403 from our build network, so a pinned last image there
  could not be verified.

Constraints:

- **S3 API:** presigned GET/PUT and private buckets. The app talks to storage only through an S3
  client configured by `S3_ENDPOINT`, `S3_ACCESS_KEY` and `S3_SECRET_KEY`.
- **One command:** `docker compose up` must work for every developer and in CI, with no bootstrap
  scripts.
- **Rejects anonymous access,** so local behaviour matches production.
- **Runs on Iranian infrastructure (ADR 0008).** Images come through a domestic registry mirror,
  and nothing depends on a foreign SaaS at runtime.
- **Licence** imposes no obligations on the restaurant's proprietary code.

## Options considered

| Option                                             | Pros                                                                                                                                                                            | Cons                                                                                                                                                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. MinIO built from source into our own image      | Same API and name as the plan                                                                                                                                                   | We would own building, patching and CVE tracking for a project that ships no images. AGPL-3.0.                                                                                                       |
| B. Last community MinIO image, pinned by digest    | No change for developers                                                                                                                                                        | Frozen forever: no security fixes. Could not even be pulled from our network (403).                                                                                                                  |
| C. Garage (AGPL-3.0, Rust)                         | Light; built for self-hosted, geo-distributed clusters                                                                                                                          | Needs a config file plus `garage layout assign/apply` before the first bucket, so it is not one command. Smaller S3 surface. AGPL.                                                                   |
| D. RustFS or Zenko CloudServer (Apache-2.0)        | Single S3 server; permissive licence                                                                                                                                            | Not tested hands-on in Phase 0. RustFS has a short track record. CloudServer is a Node.js service built for the larger Zenko stack. Neither offered a clear advantage over E for a dev-only backend. |
| **E. SeaweedFS `weed mini` (Apache-2.0)**          | One container (master, volume, filer and S3 gateway). Credentials from env. `-bucket` pre-creates the bucket. Anonymous requests answer 403. Released monthly (4.51, Oct 2026). | Narrower S3 coverage than AWS (no object lock, partial lifecycle). Internal ports are open on the compose network. A second technology to learn.                                                     |
| F. Domestic cloud object storage (e.g. ArvanCloud) | Managed, no operations                                                                                                                                                          | Not usable offline or in CI. Adds a vendor account to local development. Stays a production candidate.                                                                                               |

Footprint: option E measured about 70 MB RAM idle with an empty store and about 135 MB once it
holds data and has been restarted, in one container (`docker stats`, 2026-10-27).
The other options were not run, so no figures are claimed for them.

## Decision

- Local development and CI use **SeaweedFS `chrislusf/seaweedfs:4.51`**, pinned by digest in
  `docker-compose.dev.yml` and started as `weed mini -dir=/data -bucket=popcorn-media`.
- Only the S3 port is published, on `127.0.0.1:8333`. Credentials come from `.env`.
- Everything `weed mini` starts besides S3 is turned off where it can be: telemetry
  (`-master.telemetry=false`), WebDAV, the Iceberg and Lance catalogs, and the admin UI. The
  service runs on its own compose network, so no other container reaches its internal APIs.
- CI performs a signed PUT/GET round trip, asserts that anonymous reads and writes answer 403,
  that telemetry is off (exactly one telemetry flag, set off, and no telemetry line in the
  log), and that another container cannot reach the filer.
- Application code may only use S3 operations every candidate backend supports: put, get and
  delete object, presigned GET/PUT, and private buckets. No vendor-specific API.
- Production storage is **not** decided here. Phase 5 chooses between a self-hosted SeaweedFS
  cluster and domestic cloud storage, under the same S3 contract.

## Consequences

- **Cost:** none in licences. One container, about 70–135 MB RAM idle (measured).
- **Security trade-off:**
  - `weed mini`'s master, volume, filer and filer IAM APIs are unauthenticated; the IAM API can
    create S3 users and policies. The other services cannot reach them (own compose network),
    and they are not published. On Linux, though, the host itself routes to container IPs, so
    any local process can read stored objects through the filer without credentials (checked:
    the filer, master and volume ports answer from the host). Docker Engine before 28.0 also
    let other machines on the LAN reach unpublished ports; the README requires 28 or later.
    Production needs JWT signing for these APIs and must keep their ports unreachable
    (`security.toml`; risk register, Phase 5).
  - A single admin S3 identity is acceptable for local development. Production needs per-purpose
    least-privilege identities (risk register, Phase 5).
- **Risk:**
  - A feature we need later may be missing from the S3 gateway. This is mitigated by the
    contract above and by CI exercising the real gateway rather than a mock.
  - CI exercises signed PUT/GET and anonymous refusals, not presigned URLs, which need an S3
    client the app does not have yet. The round-4 code review generated presigned GET and PUT
    URLs by hand against this gateway, and both worked. The storage adapter's tests (Phase 3,
    menu photos and résumés) must exercise them against this backend in CI.
- **Reversibility:** high. The backend is an endpoint plus credentials. Swapping it is a
  `docker-compose.dev.yml` and `.env` change, with no application change.
- **Iran fit:**
  - Apache-2.0. `weed mini` reports anonymous statistics to `telemetry.seaweedfs.com` by
    default; it is turned off, so there are no runtime calls abroad.
  - The pinned digest is pullable through a domestic pull-through mirror (`registry-mirrors` in
    `daemon.json`, e.g. a self-hosted `registry:2` cache or a domestic cloud mirror).
  - Fallback if Docker Hub refuses Iranian IPs: keep a `docker save` tarball of the pinned digest
    in the internal artifact store and `docker load` it.

## Revisit when

- a required S3 feature (e.g. object lock, lifecycle expiry for résumés) is missing from
  SeaweedFS, or
- Phase 5 picks a production backend that should be mirrored locally instead, or
- SeaweedFS ships no release for 6 months, or leaves a High/Critical CVE in the S3 gateway
  unpatched for 30 days.
