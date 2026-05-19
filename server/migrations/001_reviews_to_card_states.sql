-- Migration: reviews (SRS model) → card_states (browse/favorite/hide model)
-- Preserves: status='skipped' → hidden=true; reviewed_at → last_viewed_at
-- Drops:     status enum (learned/learning/new were transient SRS states, discarded)

BEGIN;

ALTER TABLE reviews RENAME TO card_states;

ALTER TABLE card_states ADD COLUMN view_count integer NOT NULL DEFAULT 0;
ALTER TABLE card_states ADD COLUMN last_viewed_at timestamp with time zone;
ALTER TABLE card_states ADD COLUMN hidden boolean NOT NULL DEFAULT false;
ALTER TABLE card_states ADD COLUMN favorite boolean NOT NULL DEFAULT false;

UPDATE card_states SET hidden = true WHERE status = 'skipped';
UPDATE card_states SET last_viewed_at = reviewed_at WHERE reviewed_at IS NOT NULL;

ALTER TABLE card_states DROP COLUMN status;
ALTER TABLE card_states DROP COLUMN reviewed_at;

COMMIT;
