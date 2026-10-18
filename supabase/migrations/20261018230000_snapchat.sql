-- ============================================================================
-- UGCOrigin, add Snapchat as a linkable social platform (creators market there).
-- Own migration: a new enum value can't be used in the transaction that adds it.
-- ============================================================================

alter type social_platform add value if not exists 'snapchat';
