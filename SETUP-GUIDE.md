# RPM v2 — Setup & Deployment Guide

This walks you through everything from zero to a running app, both locally and deployed to the web.

---

## What You Need (Accounts & Software)

### Accounts to Create (all free tier)

**1. Supabase** — your database and API backend
- Sign up: [https://supabase.com/dashboard/sign-up](https://supabase.com/dashboard/sign-up)
- You can sign in with GitHub (easiest) or email
- Free tier gives you: 500MB database, 50K monthly active users, unlimited API requests
- **You'll need:** your Project URL and anon API key (generated when you create a project)

**2. Vercel** — hosts the frontend (the website people visit)
- Sign up: [https://vercel.com/signup](https://vercel.com/signup)
- Sign in with GitHub (this is the smoothest flow — Vercel auto-deploys from your repo)
- Free tier gives you: unlimited deployments, custom domains, HTTPS
- **You'll need:** a GitHub account connected to Vercel

**3. GitHub** — stores your code and triggers auto-deploys
- Sign up: [https://github.com/signup](https://github.com/signup) (skip if you already have one)
- **You'll need:** a repository for the RPM code

### Software on Your Computer

You need **Node.js** installed to run the app locally and install dependencies.

- **Check if you have it:** Open Terminal (Mac) or Command Prompt (Windows) and type `node --version`. If you see `v18.x.x` or higher, you're good.
- **If you don't have it:** Download from [https://nodejs.org](https://nodejs.org) — pick the "LTS" version. Install it like any other app. This also installs `npm` (the package manager).

You'll also want a code editor if you ever need to tweak config files. [VS Code](https://code.visualstudio.com/) is free and excellent.

---

## Part 1: Set Up Supabase (your database)

### Step 1: Create a Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name:** `rpm` (or whatever you like)
   - **Database Password:** generate a strong one and save it somewhere safe
   - **Region:** pick the one closest to you (e.g., "West US" if you're in Denver)
4. Click **"Create new project"** — it takes about 2 minutes to provision

### Step 2: Get your API credentials

Once the project is ready:

1. In the left sidebar, click **"Project Settings"** (the gear icon at the bottom)
2. Click **"API"** in the settings menu
3. You'll see two things you need — copy them somewhere:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon / public key** — a long string starting with `eyJ...`

### Step 3: Create the database tables

1. In the left sidebar, click **"SQL Editor"** (the terminal icon)
2. Click **"New query"**
3. Open the file `supabase/schema.sql` from the rpm-v2 zip in a text editor
4. Copy the ENTIRE contents and paste it into the SQL Editor
5. Click **"Run"** (or press Cmd+Enter / Ctrl+Enter)
6. You should see "Success. No rows returned." — this is correct, it created all the tables

### Step 4: Load the demo data

1. Still in SQL Editor, click **"New query"** again
2. Open `supabase/seed.sql` from the zip
3. Copy the ENTIRE contents, paste, and click **"Run"**
4. You should see "Success" — this created a demo campaign with 14 people, 6 organizations, and 25+ connections

### Step 5: Verify it worked

1. In the left sidebar, click **"Table Editor"** (the grid icon)
2. You should see tables: `campaigns`, `persons`, `organizations`, `org_memberships`, `connections`, etc.
3. Click on `persons` — you should see Maria Gonzalez, James Chen, and others
4. Click on `connections` — you should see rows including some marked `auto_generated = true` (these were created by the membership trigger)

### Step 6: Set up authentication

The app requires users to be logged in (RLS policies require authenticated role).

1. In the left sidebar, click **"Authentication"**
2. Click **"Users"** tab
3. Click **"Add user"** → **"Create new user"**
4. Enter your email and a password
5. Check **"Auto Confirm User"** (so you don't need email verification for dev)
6. Click **"Create user"**

This creates a user you can log in with. For now the app doesn't have a login screen — you'll either add one later or temporarily disable RLS for development (see the "Disable RLS for local dev" note below).

> **Shortcut for local development:** If you want to skip auth entirely during development, go to **Table Editor**, click each table, click the **"RLS"** shield icon, and disable RLS. Remember to re-enable it before going public.

---

## Part 2: Run the App Locally

### Step 1: Unzip and open in terminal

1. Unzip `rpm-v2.zip` to a folder on your computer
2. Open Terminal (Mac) or Command Prompt (Windows)
3. Navigate to the folder:
   ```bash
   cd path/to/rpm-v2
   ```

### Step 2: Create your environment file

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```
   (On Windows: `copy .env.example .env`)

2. Open `.env` in a text editor and fill in your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://abcdefgh.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...your-full-key-here
   ```

### Step 3: Install dependencies

```bash
npm install
```

This downloads React, MUI, Supabase client, and everything else. Takes 30–60 seconds. You'll see some warnings — that's normal.

### Step 4: Start the dev server

```bash
npm run dev
```

You should see output like:
```
  VITE v5.1.0  ready in 400ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.x:5173/
```

### Step 5: Open it

Go to **http://localhost:5173** in your browser (Chrome or Firefox recommended).

You should see:
- The "Power Map" logo in the top-left
- A campaign dropdown that lists "City Council Housing Vote"
- Select it → the network visualization appears with 14 people and 6 organizations
- Click any node → sidebar slides open with their details
- Scroll to zoom, drag to pan

### Troubleshooting local setup

| Problem | Solution |
|---------|----------|
| "command not found: npm" | Install Node.js from nodejs.org |
| Blank white screen | Open browser dev tools (F12) → Console tab. Look for errors. Usually a missing env variable. |
| "Failed to fetch graph" error | Check that your `.env` values are correct. Make sure there are no extra spaces or quotes around the values. |
| No campaign appears in dropdown | The seed data didn't load. Go back to Supabase SQL Editor and re-run `seed.sql`. |
| Nodes appear but no connections | RLS might be blocking the `connections_resolved` view. Disable RLS temporarily (see note in Part 1 Step 6). |

---

## Part 3: Deploy to the Web (Vercel)

### Step 1: Push your code to GitHub

1. Create a new repository on GitHub:
   - Go to [https://github.com/new](https://github.com/new)
   - Name it `rpm` (or whatever you want)
   - Leave it **Public** or **Private** — either works
   - Do NOT initialize with README (you already have one)
   - Click **"Create repository"**

2. In your terminal (inside the rpm-v2 folder):
   ```bash
   git init
   git add .
   git commit -m "Initial RPM v2 setup"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/rpm.git
   git push -u origin main
   ```

   Replace `YOUR-USERNAME` with your GitHub username.

> **Important:** Your `.env` file contains secrets. Create a `.gitignore` file first:
> ```bash
> echo ".env" >> .gitignore
> echo "node_modules" >> .gitignore
> echo "dist" >> .gitignore
> ```
> Run this BEFORE the `git add .` step.

### Step 2: Connect to Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Find your `rpm` repo in the list and click **"Import"**
4. On the configuration screen:
   - **Framework Preset:** Vite (should auto-detect)
   - **Root Directory:** leave as `.` (the default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)

5. Click **"Environment Variables"** and add these two:

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | `https://abcdefgh.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...your-full-key-here` |

6. Click **"Deploy"**

Vercel will build and deploy. Takes about 60–90 seconds. When it finishes, you'll see a URL like `https://rpm-abc123.vercel.app`.

### Step 3: Verify the deployment

Visit the URL. You should see the same app that was running locally. Select the campaign, click nodes, test the modals.

### Auto-deploys going forward

Every time you push to the `main` branch on GitHub, Vercel automatically rebuilds and deploys. So your workflow becomes:

1. Make changes locally
2. Test with `npm run dev`
3. `git add . && git commit -m "description" && git push`
4. Vercel deploys automatically in ~60 seconds

---

## Part 4: Optional — Custom Domain

If you want this on your own domain (e.g., `powermap.yourdomain.com`):

1. In Vercel dashboard, click your project → **"Settings"** → **"Domains"**
2. Type your domain (e.g., `powermap.yourdomain.com`)
3. Vercel will show you DNS records to add
4. Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and add the CNAME record Vercel tells you to
5. Wait 5–30 minutes for DNS propagation
6. Vercel auto-provisions an SSL certificate — HTTPS just works

---

## Part 5: Day-to-Day Usage

### Adding data

You can add people, organizations, and connections directly through the app UI:
- **"Add Person"** button → 3-tab form (Identity & Roles, Power Dynamics, Contact & Notes)
- **"Add Org"** button → creates organization with type and influence
- **"Add Connection"** button → polymorphic picker (person or org on either end), 3 tiers

### Adding org memberships

When you click an organization node and open the sidebar, there's a "Members" section with a **+** button. This opens the Add Membership modal where you assign a person to the org as Board, Executive, or Staff. This automatically creates a primary connection.

### Bulk data entry

For bulk loading, use the Supabase dashboard directly:
1. Go to **Table Editor** → select the table
2. Click **"Insert row"** or use **"Import data from CSV"**

### Backing up your data

In Supabase dashboard → **"Project Settings"** → **"Database"** → **"Backups"**. Supabase makes daily backups on free tier. You can also export via SQL Editor:
```sql
COPY persons TO STDOUT WITH CSV HEADER;
```

---

## Cost Summary

| Service | Free Tier Includes | When You'd Pay |
|---------|--------------------|----------------|
| **Supabase** | 500MB database, 50K users, unlimited API | Over 500MB storage or need phone auth ($25/mo) |
| **Vercel** | Unlimited deploys, 100GB bandwidth/month | Over 100GB bandwidth or need team features ($20/mo) |
| **GitHub** | Unlimited repos (public or private) | Need advanced team features |
| **Total** | **$0/month** for typical single-user or small-team use | |

---

## File Reference

| File | What It Does |
|------|-------------|
| `supabase/schema.sql` | Creates all database tables, triggers, views, RLS policies |
| `supabase/seed.sql` | Loads demo campaign data (14 people, 6 orgs, 25+ connections) |
| `.env.example` | Template for your Supabase credentials |
| `src/api/supabase.js` | All database queries (fetch graph, create person, etc.) |
| `src/store/useStore.js` | App state management (what's selected, what's filtered, etc.) |
| `src/components/canvas/PowerMapCanvas.jsx` | The network visualization (PixiJS + D3-force) |
| `src/components/sidebar/InspectorSidebar.jsx` | Detail panel when you click a node |
| `src/components/modals/` | All the data entry forms (person, org, connection, membership) |
