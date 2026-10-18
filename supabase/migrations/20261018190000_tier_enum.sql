-- ============================================================================
-- UGCOrigin, extend the creator tier ladder from 5 to 7 rungs.
-- MUST be its own migration: Postgres cannot USE a newly-added enum value in
-- the same transaction it is added, so the engine (next migration) references
-- these only after this one commits.
-- Final order: origin → rising → pro → standout → elite → signature → luminary
-- (entry is capped at `pro`; standout/elite/signature/luminary are earned only).
-- ============================================================================

alter type creator_tier add value if not exists 'standout' before 'elite';
alter type creator_tier add value if not exists 'luminary' after 'signature';
