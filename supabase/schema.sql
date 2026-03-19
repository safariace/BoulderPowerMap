-- ============================================================================
-- RPM v2 — Supabase Schema Migration
-- ============================================================================
-- Tables:
--   1. campaigns           — Campaign containers
--   2. persons             — People in the network
--   3. organizations       — Organizations as first-class entities
--   4. org_memberships     — Person ↔ Org with role (board/executive/staff)
--   5. connections         — All relationships (person↔person, org↔org, person↔org)
--   6. campaign_persons    — Many-to-many: persons in campaigns
--   7. campaign_orgs       — Many-to-many: orgs in campaigns
--   8. settings            — App-level key/value config
--
-- Connection tiers:
--   primary   → solid line   (same committee, spouse, board membership)
--   secondary → dashed line  (monthly affiliations, regular interactions)
--   informal  → dotted line  (annual interactions, known to each other)
--
-- Auto-generation:
--   When an org_membership row is inserted, a trigger creates a
--   corresponding primary connection between the person and the org.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. Campaigns ──────────────────────────────────────────────────────────

CREATE TABLE campaigns (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_status ON campaigns(status);

-- ─── 2. Persons ────────────────────────────────────────────────────────────

CREATE TABLE persons (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identity
  name              TEXT NOT NULL DEFAULT '',
  avatar_url        TEXT NOT NULL DEFAULT '',

  -- Primary role
  primary_role      TEXT NOT NULL DEFAULT '',
  primary_org_name  TEXT NOT NULL DEFAULT '',

  -- Secondary role
  secondary_role      TEXT NOT NULL DEFAULT '',
  secondary_org_name  TEXT NOT NULL DEFAULT '',

  -- Access
  chaperone_id      UUID REFERENCES persons(id) ON DELETE SET NULL,

  -- Contact
  email             TEXT NOT NULL DEFAULT '',
  phone             TEXT NOT NULL DEFAULT '',
  linkedin_url      TEXT NOT NULL DEFAULT '',
  website_url       TEXT NOT NULL DEFAULT '',

  -- Power dynamics
  influence_score   SMALLINT NOT NULL DEFAULT 50 CHECK (influence_score BETWEEN 0 AND 100),
  role_category     TEXT NOT NULL DEFAULT 'neutral'
                      CHECK (role_category IN ('ally','champion','neutral','target','opponent')),
  political_leaning TEXT NOT NULL DEFAULT 'unknown'
                      CHECK (political_leaning IN ('progressive','moderate','conservative','unknown')),

  -- Rich text notes (stored as HTML from the editor)
  notes             TEXT NOT NULL DEFAULT '',

  -- Layout (saved positions for the visualization)
  pos_x             REAL NOT NULL DEFAULT 0,
  pos_y             REAL NOT NULL DEFAULT 0,

  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_persons_influence ON persons(influence_score);
CREATE INDEX idx_persons_role ON persons(role_category);

-- ─── 3. Organizations ──────────────────────────────────────────────────────

CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL DEFAULT '',
  org_type      TEXT NOT NULL DEFAULT 'other'
                  CHECK (org_type IN ('government','nonprofit','corporate','community','political','other')),
  description   TEXT NOT NULL DEFAULT '',
  website_url   TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT NOT NULL DEFAULT '',

  -- Power dynamics (orgs have influence too)
  influence_score SMALLINT NOT NULL DEFAULT 50 CHECK (influence_score BETWEEN 0 AND 100),

  -- Rich text notes
  notes         TEXT NOT NULL DEFAULT '',

  -- Layout
  pos_x         REAL NOT NULL DEFAULT 0,
  pos_y         REAL NOT NULL DEFAULT 0,

  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 4. Org Memberships ────────────────────────────────────────────────────
--   Links a person to an organization with a specific seat type.
--   Inserting here auto-generates a primary connection via trigger.

CREATE TABLE org_memberships (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id   UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  seat_type   TEXT NOT NULL DEFAULT 'staff'
                CHECK (seat_type IN ('board','executive','staff')),
  title       TEXT NOT NULL DEFAULT '',       -- e.g. "Chair", "CFO", "Program Director"
  is_active   BOOLEAN NOT NULL DEFAULT true,
  started_at  DATE,
  ended_at    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(person_id, org_id, seat_type)
);

CREATE INDEX idx_memberships_person ON org_memberships(person_id);
CREATE INDEX idx_memberships_org ON org_memberships(org_id);
CREATE INDEX idx_memberships_seat ON org_memberships(seat_type);

-- ─── 5. Connections ────────────────────────────────────────────────────────
--   Polymorphic: source/target can be a person OR an org.
--   We use separate nullable FKs rather than a single generic ID
--   so Postgres enforces referential integrity.

CREATE TABLE connections (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Source (exactly one must be non-null)
  source_person_id    UUID REFERENCES persons(id) ON DELETE CASCADE,
  source_org_id       UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Target (exactly one must be non-null)
  target_person_id    UUID REFERENCES persons(id) ON DELETE CASCADE,
  target_org_id       UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Connection metadata
  tier                TEXT NOT NULL DEFAULT 'primary'
                        CHECK (tier IN ('primary','secondary','informal')),
  relationship_type   TEXT NOT NULL DEFAULT '',
  label               TEXT NOT NULL DEFAULT '',
  strength            SMALLINT NOT NULL DEFAULT 50 CHECK (strength BETWEEN 0 AND 100),
  direction           TEXT NOT NULL DEFAULT 'bidirectional'
                        CHECK (direction IN ('bidirectional','source_to_target','target_to_source')),
  notes               TEXT NOT NULL DEFAULT '',

  -- If auto-generated from org_membership
  auto_generated      BOOLEAN NOT NULL DEFAULT false,
  membership_id       UUID REFERENCES org_memberships(id) ON DELETE CASCADE,

  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure at least one source and one target
  CONSTRAINT chk_source CHECK (
    (source_person_id IS NOT NULL AND source_org_id IS NULL) OR
    (source_person_id IS NULL AND source_org_id IS NOT NULL)
  ),
  CONSTRAINT chk_target CHECK (
    (target_person_id IS NOT NULL AND target_org_id IS NULL) OR
    (target_person_id IS NULL AND target_org_id IS NOT NULL)
  )
);

CREATE INDEX idx_conn_source_person ON connections(source_person_id);
CREATE INDEX idx_conn_source_org ON connections(source_org_id);
CREATE INDEX idx_conn_target_person ON connections(target_person_id);
CREATE INDEX idx_conn_target_org ON connections(target_org_id);
CREATE INDEX idx_conn_tier ON connections(tier);

-- ─── 6. Campaign ↔ Persons ─────────────────────────────────────────────────

CREATE TABLE campaign_persons (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  person_id   UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, person_id)
);

-- ─── 7. Campaign ↔ Orgs ────────────────────────────────────────────────────

CREATE TABLE campaign_orgs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, org_id)
);

-- ─── 8. Settings ───────────────────────────────────────────────────────────

CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Auto-updated timestamps ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_campaigns_updated BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_persons_updated BEFORE UPDATE ON persons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_connections_updated BEFORE UPDATE ON connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Auto-generate connection when membership is created ───────────────────

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
    NEW.seat_type,  -- 'board', 'executive', or 'staff'
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

CREATE TRIGGER trg_membership_auto_connection
  AFTER INSERT ON org_memberships
  FOR EACH ROW EXECUTE FUNCTION auto_generate_membership_connection();

-- When membership is deleted, the cascade on membership_id handles cleanup.

-- ─── Useful Views ──────────────────────────────────────────────────────────

-- Flattened connection view that resolves source/target to name + type
CREATE OR REPLACE VIEW connections_resolved AS
SELECT
  c.id,
  c.tier,
  c.relationship_type,
  c.label,
  c.strength,
  c.direction,
  c.auto_generated,
  c.created_at,

  -- Source
  COALESCE(c.source_person_id, c.source_org_id) AS source_id,
  CASE WHEN c.source_person_id IS NOT NULL THEN 'person' ELSE 'organization' END AS source_type,
  COALESCE(sp.name, so.name) AS source_name,

  -- Target
  COALESCE(c.target_person_id, c.target_org_id) AS target_id,
  CASE WHEN c.target_person_id IS NOT NULL THEN 'person' ELSE 'organization' END AS target_type,
  COALESCE(tp.name, torg.name) AS target_name

FROM connections c
LEFT JOIN persons sp ON sp.id = c.source_person_id
LEFT JOIN organizations so ON so.id = c.source_org_id
LEFT JOIN persons tp ON tp.id = c.target_person_id
LEFT JOIN organizations torg ON torg.id = c.target_org_id;

-- Org membership view with person names
CREATE OR REPLACE VIEW org_members_view AS
SELECT
  om.id AS membership_id,
  om.org_id,
  o.name AS org_name,
  om.person_id,
  p.name AS person_name,
  p.influence_score,
  om.seat_type,
  om.title,
  om.is_active,
  om.started_at,
  om.ended_at
FROM org_memberships om
JOIN persons p ON p.id = om.person_id
JOIN organizations o ON o.id = om.org_id;

-- ─── Row Level Security ────────────────────────────────────────────────────
-- For now: authenticated users can do everything. Tighten later.

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read/write everything
CREATE POLICY "auth_all" ON campaigns FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON persons FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON organizations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON org_memberships FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON connections FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON campaign_persons FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON campaign_orgs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all" ON settings FOR ALL USING (auth.role() = 'authenticated');
