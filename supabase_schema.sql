-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New Query)

create table if not exists blood_inventory (
  id bigint generated always as identity primary key,
  sample_id text not null unique,
  blood_type text not null check (blood_type in ('A+','A-','B+','B-','O+','O-','AB+','AB-')),
  collection_center text not null,
  date_received date not null,
  rack text not null,
  slot integer not null,
  expiry_date date not null,
  status text not null default 'in_storage' check (status in ('in_storage','expiring_soon','expired')),
  created_at timestamptz default now()
);

-- Row Level Security: enable and allow authenticated staff full access.
alter table blood_inventory enable row level security;

create policy "Authenticated staff can read inventory"
  on blood_inventory for select
  to authenticated
  using (true);

create policy "Authenticated staff can insert inventory"
  on blood_inventory for insert
  to authenticated
  with check (true);

create policy "Authenticated staff can update inventory"
  on blood_inventory for update
  to authenticated
  using (true);

-- Optional: a scheduled function/trigger to auto-update status based on expiry_date
-- can be added later using pg_cron if you want it fully automated server-side.
-- For this project, status is also recalculated client-side on read.
