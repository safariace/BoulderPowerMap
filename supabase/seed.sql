-- ============================================================================
-- RPM v2 — Seed Data for "City Council Housing Vote" Demo Campaign
-- Run this AFTER schema.sql in the Supabase SQL Editor.
-- ============================================================================

-- ─── Campaign ──────────────────────────────────────────────────────────────

INSERT INTO campaigns (id, name, description, status) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'City Council Housing Vote', 'Campaign to pass affordable housing ordinance', 'active');

-- ─── Organizations ─────────────────────────────────────────────────────────

INSERT INTO organizations (id, name, org_type, description, influence_score, notes) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'City Council',           'government',  'Municipal legislative body',              95, '<p>9-member council. Need 5 votes to pass.</p>'),
  ('00000000-0000-0000-0000-0000000000a2', 'Housing Authority',      'government',  'Oversees public housing and HUD funds',   85, '<p>Board meets monthly. Chair is key ally.</p>'),
  ('00000000-0000-0000-0000-0000000000a3', 'Community First',        'nonprofit',   'Community organizing nonprofit',           75, '<p>Strongest grassroots partner. 2000+ member base.</p>'),
  ('00000000-0000-0000-0000-0000000000a4', 'Horizonte Development',  'corporate',   'Real estate development firm',             80, '<p>Opposing the ordinance. Funding counter-campaign.</p>'),
  ('00000000-0000-0000-0000-0000000000a5', 'Grace Community Church', 'community',   'Large congregation with community programs',65, ''),
  ('00000000-0000-0000-0000-0000000000a6', 'SEIU Local 521',        'political',   'Service workers union',                    70, '');

-- ─── Persons ───────────────────────────────────────────────────────────────

INSERT INTO persons (id, name, primary_role, primary_org_name, secondary_role, secondary_org_name, chaperone_id, email, phone, influence_score, role_category, political_leaning, notes) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Maria Gonzalez',     'Council Member',        'City Council',        'Board Member',     'Community First',      NULL, 'maria@council.gov', '555-0101', 92, 'champion', 'progressive', '<p><strong>Key champion.</strong> Introduced the ordinance. Close with labor.</p>'),
  ('a0000000-0000-0000-0000-000000000002', 'James Chen',         'Board Chair',           'Housing Authority',   '',                 '',                     NULL, 'jchen@housing.gov', '555-0102', 88, 'ally',     'moderate',    '<p>Controls HUD funding allocation. Needs political cover to support publicly.</p>'),
  ('a0000000-0000-0000-0000-000000000003', 'Aisha Williams',     'Executive Director',    'Community First',     '',                 '',                     NULL, 'aisha@commfirst.org','555-0103', 85, 'champion', 'progressive', '<p>Runs the ground operation. Can mobilize 200+ to council hearings.</p>'),
  ('a0000000-0000-0000-0000-000000000004', 'Robert Park',        'Policy Advisor',        'Mayor''s Office',     '',                 '',                     'a0000000-0000-0000-0000-000000000001', 'rpark@mayor.gov', '555-0104', 78, 'ally', 'moderate', '<p>Drafting amendment language. Go through Maria to reach him.</p>'),
  ('a0000000-0000-0000-0000-000000000005', 'Lisa Thompson',      'Neighborhood Organizer','Block Alliance',      'Volunteer',        'Grace Community Church',NULL, 'lisa@blockalliance.org','555-0105', 72, 'champion', 'progressive', ''),
  ('a0000000-0000-0000-0000-000000000006', 'Pastor David Washington','Senior Pastor',     'Grace Community Church','',                '',                     NULL, 'pastor@gracechurch.org','555-0106', 70, 'neutral', 'moderate', '<p>Influential in the African-American community. Has not committed yet.</p>'),
  ('a0000000-0000-0000-0000-000000000007', 'Sarah Kim',          'Reporter',              'City Herald',         '',                 '',                     NULL, 'skim@herald.com', '555-0107', 65, 'neutral', 'unknown', '<p>Covering the housing beat. Fair reporter but follows opposition talking points.</p>'),
  ('a0000000-0000-0000-0000-000000000008', 'Carlos Rivera',      'Union Rep',             'SEIU Local 521',      '',                 '',                     NULL, 'crivera@seiu521.org','555-0108', 68, 'ally', 'progressive', ''),
  ('a0000000-0000-0000-0000-000000000009', 'Helen Nguyen',       'School Board Trustee',  'Unified School Dist', 'Parent',           '',                     NULL, 'hnguyen@usd.edu', '555-0109', 74, 'ally', 'moderate', ''),
  ('a0000000-0000-0000-0000-000000000010', 'Tom Bradley',        'Lobbyist',              'Development Partners','',                 '',                     NULL, 'tbradley@devpartners.com','555-0110', 76, 'opponent', 'conservative', '<p>Hired by Horizonte. Running counter-messaging. <em>Watch for astroturf groups.</em></p>'),
  ('a0000000-0000-0000-0000-000000000011', 'Marcus Johnson',     'Youth Program Director','Urban League',        '',                 '',                     'a0000000-0000-0000-0000-000000000003', '', '555-0111', 60, 'champion', 'progressive', '<p>Go through Aisha. Marcus runs the youth voter reg program.</p>'),
  ('a0000000-0000-0000-0000-000000000012', 'Emily Foster',       'Regional Manager',      'HUD Regional Office', '',                 '',                     NULL, 'efoster@hud.gov', '555-0112', 70, 'ally', 'moderate', ''),
  ('a0000000-0000-0000-0000-000000000013', 'Rosa Martinez',      'Tenant Advocate',       'Renters United',      '',                 '',                     NULL, 'rosa@rentersunited.org','555-0113', 62, 'champion', 'progressive', ''),
  ('a0000000-0000-0000-0000-000000000014', 'Abdul Rashid',       'Small Business Owner',  'Main St Collective',  '',                 '',                     NULL, 'abdul@mainst.biz', '555-0114', 50, 'neutral', 'moderate', '');

-- ─── Org Memberships (trigger auto-generates primary connections) ──────────

INSERT INTO org_memberships (person_id, org_id, seat_type, title) VALUES
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'board',     'Council Member, District 3'),
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a3', 'board',     'Board Member'),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a2', 'board',     'Chair'),
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000a3', 'executive', 'Executive Director'),
  ('a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-0000000000a6', 'executive', 'Lead Rep'),
  ('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-0000000000a5', 'executive', 'Senior Pastor'),
  ('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-0000000000a5', 'staff',     'Volunteer Coordinator'),
  ('a0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-0000000000a4', 'staff',     'Hired Lobbyist'),
  ('a0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-0000000000a2', 'staff',     'HUD Liaison'),
  ('a0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-0000000000a3', 'staff',     'Youth Program Lead');

-- ─── Manual Connections (Primary) ──────────────────────────────────────────

INSERT INTO connections (source_person_id, target_person_id, tier, relationship_type, label, strength) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'primary', 'Same committee',     'Housing Committee co-chairs', 85),
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'primary', 'Same committee',     'Task Force co-leads',         90),
  ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000008', 'primary', 'Same committee',     'Labor-Community Coalition',    75),
  ('a0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000007', 'primary', 'Spouse',             'Married',                      95),
  ('a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000013', 'primary', 'Same committee',     'Tenant Board',                 70);

-- ─── Secondary Connections ─────────────────────────────────────────────────

INSERT INTO connections (source_person_id, target_person_id, tier, relationship_type, label, strength) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'secondary', 'Regular collaborator', 'Weekly policy meetings',     75),
  ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000005', 'secondary', 'Coalition partner',    'Monthly coalition calls',    65),
  ('a0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000014', 'secondary', 'Monthly meetings',     'Small business outreach',    55),
  ('a0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000002', 'secondary', 'Regular collaborator', 'Monthly HUD coordination',   70);

-- Org↔Org secondary
INSERT INTO connections (source_org_id, target_org_id, tier, relationship_type, label, strength) VALUES
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000a6', 'secondary', 'Works with regularly', 'Labor-community joint actions', 70),
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2', 'secondary', 'Works with regularly', 'Policy coordination',           75);

-- ─── Informal Connections ──────────────────────────────────────────────────

INSERT INTO connections (source_person_id, target_person_id, tier, relationship_type, label, strength) VALUES
  ('a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000006', 'informal', 'Known to each other', 'Same church',               50),
  ('a0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000014', 'informal', 'Known to each other', 'Congregation member',       40),
  ('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000010', 'informal', 'Past colleague',      'College friends — watch this', 45),
  ('a0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000011', 'informal', 'Known to each other', 'Kids same school',          35),
  ('a0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000011', 'informal', 'Known to each other', 'Neighbors',                 40);

-- Org↔Org informal
INSERT INTO connections (source_org_id, target_org_id, tier, relationship_type, label, strength) VALUES
  ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000a1', 'informal', 'Affiliated with', 'Lobbying council members', 60);

-- ─── Campaign Assignments ──────────────────────────────────────────────────

INSERT INTO campaign_persons (campaign_id, person_id)
SELECT 'c0000000-0000-0000-0000-000000000001', id FROM persons;

INSERT INTO campaign_orgs (campaign_id, org_id)
SELECT 'c0000000-0000-0000-0000-000000000001', id FROM organizations;
