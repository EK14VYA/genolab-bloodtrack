# Genolab BloodTrack

Blood Sample Inventory & Storage Management System — internal tool for logging incoming blood
samples, managing rack/slot refrigerator storage, tracking expiry, and monitoring blood type
distribution.

**Stack:** Vite + React + Tailwind CSS + Supabase

## Important: this runs even without Supabase

If you don't set up `.env`, the app automatically falls back to realistic **mock data** running
in memory. Every page — Dashboard, Inventory Log, Storage Map, Add Sample — works fully in this
mode. This means your demo/evaluation can never fail due to a database connection issue.

A small amber badge in the sidebar will say "Demo mode" when this fallback is active.

## Quick Start (Demo Mode — no setup required)

```bash
npm install
npm run dev
```

Open the URL shown in the terminal. On the login page, enter any email and password — demo
mode accepts any non-empty credentials.

## Setting up real Supabase (optional, for full marks on "database integration")

1. Create a free project at supabase.com.
2. Go to **SQL Editor** in your Supabase dashboard, paste the contents of `supabase_schema.sql`
   from this project, and run it. This creates the `blood_inventory` table.
3. Go to **Authentication -> Users** and add a staff user (email + password) so you can log in.
4. Go to **Settings -> API** and copy your **Project URL** and **anon public key**.
5. Copy `.env.example` to `.env` and paste in your credentials:
   ```bash
   cp .env.example .env
   ```
6. Restart the dev server:
   ```bash
   npm run dev
   ```

The app will now read/write real data from Supabase instead of mock data, and the "Demo mode"
badge will disappear.

## Project Structure

```
src/
  data/mockInventory.js     mock dataset + generators (fallback data)
  lib/supabaseClient.js     Supabase client + data access functions (fetch/add/check-slot)
  lib/AuthContext.jsx       auth state (works in both demo and live mode)
  components/AppShell.jsx   sidebar navigation + page layout
  components/ProtectedRoute.jsx
  pages/Login.jsx
  pages/Dashboard.jsx       stat cards, blood type pie chart, expiry alert banner
  pages/InventoryLog.jsx    full searchable/filterable sample table
  pages/StorageMap.jsx      rack/slot visual grid (signature feature)
  pages/AddSample.jsx       form to log new incoming samples
```

## Features

- **Login with roles** — sign in as **Lab Technician** (view-only) or **Admin** (full access:
  add, edit, discard samples). Role is selected right on the login screen for demo purposes.
- **Dashboard** — stat cards, blood type pie chart, expiry alert banner with a **Send Alert
  Email** button (simulated — logs a confirmation in-app), a **low stock warning** banner when
  any blood type drops below 3 units, and a **date range filter** (Last 7 Days / Last 30 Days /
  All Time).
- **Inventory Log** — searchable, filterable, **sortable table** (click any column header),
  **Export CSV** button, and an **Edit** action per row (Admin only).
- **Storage Map** — the signature rack/slot visualization. Click a slot to see its details,
  **Print Label** (opens a formatted, printable label), and (Admin only) **Edit Sample** or
  **Discard from Storage**.
- **Add Sample** — log new incoming units, with manually editable Date Received and Expiry Date
  fields (Admin only).

## Design Notes

The visual identity is grounded in the domain — cold storage + hematology — rather than a
generic dashboard template:

- **Palette:** frost-white background, steel-navy text, clinical-teal for "occupied", blood-red
  reserved specifically for alerts/expiry (not decorative).
- **Type:** IBM Plex Sans (headers, technical/instrument feel), Inter (body), IBM Plex Mono
  (Sample IDs and data-dense table cells).
- **Storage Map:** styled like an actual refrigerator schematic — dark "unit" panels per rack,
  slot grid inside, with a subtle pulse animation on slots nearing expiry.

## For Your Report / Viva

- **Frontend:** React (JavaScript/JSX), Tailwind CSS for styling, react-router-dom for navigation,
  recharts for the pie chart.
- **Backend:** Supabase (PostgreSQL database + built-in authentication), accessed via the
  `@supabase/supabase-js` client library — no separate backend server needed.
- **Innovation angle:** the rack/slot Storage Map is a direct visual representation of the
  physical refrigerator layout, which most inventory-tracking projects don't attempt.
- **Data flow:** `blood_inventory` table -> `fetchInventory()` recalculates status
  (in_storage / expiring_soon / expired) based on `expiry_date` on every read, so status is
  always accurate without needing a background job.
