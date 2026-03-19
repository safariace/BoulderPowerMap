# Community Relational Power Map v2

**Stack:** React + MUI + PixiJS + D3-force + GSAP → Vercel  
**Backend:** Supabase (Postgres + auto-REST + auth + realtime)

## Quick Start

### 1. Create a Supabase Project

Go to [supabase.com](https://supabase.com), create a new project. Note your:
- **Project URL** (e.g., `https://abc123.supabase.co`)
- **Anon public key** (Settings → API → anon/public)

### 2. Run the Schema Migration

In Supabase Dashboard → **SQL Editor**, run these files in order:
1. `supabase/schema.sql` — creates all 8 tables, triggers, views, and RLS policies
2. `supabase/seed.sql` — populates a demo campaign with 14 people, 6 orgs, and 25+ connections

### 3. Set Up the Frontend

```bash
cd rpm-v2
cp .env.example .env
# Edit .env with your Supabase URL and anon key
npm install
npm run dev
```

Open `http://localhost:5173`. You should see the "City Council Housing Vote" campaign with the full network.

### 4. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

When prompted, set the environment variables:
- `VITE_SUPABASE_URL` → your project URL
- `VITE_SUPABASE_ANON_KEY` → your anon key

That's it. Vercel builds and deploys automatically on every git push.

---

## Architecture

```
rpm-v2/
├── index.html                         # Shell with CDN scripts (PixiJS, D3, GSAP)
├── supabase/
│   ├── schema.sql                     # Full DB schema (8 tables, triggers, views)
│   └── seed.sql                       # Demo campaign data
├── src/
│   ├── index.jsx                      # React entry point
│   ├── api/
│   │   └── supabase.js                # Supabase client + typed API helpers
│   ├── store/
│   │   └── useStore.js                # Zustand global state
│   ├── theme/
│   │   └── theme.js                   # Custom MUI theme
│   └── components/
│       ├── App.jsx                    # Root layout shell
│       ├── common/
│       │   ├── Toolbar.jsx            # Campaign selector + action buttons
│       │   └── FilterBar.jsx          # Tier toggles, role filter, influence slider
│       ├── canvas/
│       │   └── PowerMapCanvas.jsx     # PixiJS + D3-force rendering engine
│       ├── sidebar/
│       │   └── InspectorSidebar.jsx   # Dual-mode detail view (person / org)
│       └── modals/
│           ├── AddPersonModal.jsx     # 3-tab: Identity & Roles, Power, Contact
│           ├── AddOrgModal.jsx        # Org creation with type + influence
│           ├── AddConnectionModal.jsx # Polymorphic source/target, 3 tiers
│           └── AddMembershipModal.jsx # Assign person to org (board/exec/staff)
```

## Data Model

### Persons
| Field | Description |
|---|---|
| name | Full name |
| primary_role / primary_org_name | Main position (e.g., "Council Member" at "City Council") |
| secondary_role / secondary_org_name | Second hat they wear |
| chaperone_id | FK to another person — the gatekeeper who manages access |
| influence_score | 0–100. Determines node size and stature (0–59 Participant, 60–79 Influencer, 80+ Decider) |
| role_category | ally, champion, neutral, target, opponent — determines shirt color |
| notes | Rich HTML from the text editor |

### Organizations
| Field | Description |
|---|---|
| name | Org name |
| org_type | government, nonprofit, corporate, community, political, other |
| influence_score | 0–100, same stature system as persons |
| notes | Rich HTML |

### Org Memberships
Links a person to an org with a **seat type** (board, executive, staff) and optional title. When a membership is created, a database trigger **automatically generates a primary connection** between the person and the org.

### Connections (3 Tiers)
| Tier | Line Style | Person Examples | Org Examples |
|---|---|---|---|
| **Primary** | Solid (coral) | Same org/committee, Spouse, Co-board member | Board, Executive, Staff (auto from membership) |
| **Secondary** | Dashed (navy) | Monthly meetings, Regular collaborator | Works with regularly, Joint programs |
| **Informal** | Dotted (teal) | Annual events, Known to each other | Affiliated with, Works with infrequently |

Connections are **polymorphic** — source and target can each be a person OR an organization. The schema uses separate nullable FKs with check constraints to maintain referential integrity.

### Visualization
- **Persons** render as pawn figures (procedural: skin tone, hair, shirt color by role)
- **Organizations** render as building icons (color by role)
- **Stature rings:** 0 (participant), 1 (influencer), 2 (decider) concentric ellipses
- **Click** any node → GSAP camera pan, sidebar opens, non-connected nodes dim
- **Filters:** toggle tiers, show/hide orgs, filter by role, set min influence

## Rich Text Notes

The notes field stores HTML. The `AddPersonModal` and `AddOrgModal` currently use a plain `<textarea>` as a placeholder. To add a full rich text editor, install TipTap:

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link
```

Then swap the textarea for a TipTap `<EditorContent />` component. The stored HTML renders directly in the sidebar via `dangerouslySetInnerHTML`.
