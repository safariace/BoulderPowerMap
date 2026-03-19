-- ============================================================================
-- RPM v2 — Trigger Fix (run this in Supabase SQL Editor BEFORE seed.sql)
-- ============================================================================
-- Bug: the original trigger set created_by = NEW.person_id, which is a UUID
-- from the persons table — not from auth.users. This caused a FK violation
-- on every org_memberships INSERT, breaking the seed entirely.
-- Fix: set created_by = NULL instead.
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_generate_membership_connection()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO connections (
    source_person_id, target_org_id, tier, relationship_type,
    label, strength, auto_generated, membership_id, created_by
  ) VALUES (
    NEW.person_id,
    NEW.org_id,
    'primary',
    NEW.seat_type,
    COALESCE(NULLIF(NEW.title, ''), initcap(NEW.seat_type)) || ' at (auto)',
    CASE NEW.seat_type
      WHEN 'board' THEN 85
      WHEN 'executive' THEN 80
      WHEN 'staff' THEN 65
      ELSE 50
    END,
    true,
    NEW.id,
    NULL  -- created_by: no auth user context during seed/trigger
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
