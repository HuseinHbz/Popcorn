-- Extensions required by the data model (ADR 0002).
-- btree_gist backs the booking overlap EXCLUDE constraint (Phase 4).
CREATE EXTENSION IF NOT EXISTS btree_gist;
