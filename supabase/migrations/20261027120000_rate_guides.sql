-- Admin-owned starting-rate bands by niche and state.
-- Creators are nudged toward these numbers. Their own listing never sets the band.
-- `*` is the fallback for every niche or every state.
-- Writes are service-role only (the tiers admin screen). Anyone can read the bands.

create table if not exists public.rate_guides (
  id             uuid primary key default gen_random_uuid(),
  niche          text not null,
  location       text not null default '*',
  low_naira      integer not null check (low_naira > 0),
  typical_naira  integer not null check (typical_naira >= low_naira),
  high_naira     integer not null check (high_naira >= typical_naira),
  unique (niche, location)
);

alter table public.rate_guides enable row level security;

drop policy if exists rate_guides_read on public.rate_guides;
create policy rate_guides_read on public.rate_guides
  for select to anon, authenticated
  using (true);

grant select on public.rate_guides to anon, authenticated;
revoke insert, update, delete on public.rate_guides from anon, authenticated;

insert into public.rate_guides (niche, location, low_naira, typical_naira, high_naira) values
  ('*', '*', 15000, 25000, 45000),
  ('Lifestyle', '*', 15000, 25000, 40000),
  ('Fashion', '*', 18000, 30000, 45000),
  ('Dance & Choreography', '*', 15000, 25000, 40000),
  ('Beauty & Skincare', '*', 20000, 32000, 50000),
  ('Food & Cooking', '*', 15000, 25000, 40000),
  ('Finance & Fintech', '*', 30000, 45000, 70000),
  ('SaaS / Tech', '*', 30000, 45000, 70000),
  ('*', 'Lagos', 19000, 31000, 56000),
  ('Lifestyle', 'Lagos', 19000, 31000, 50000),
  ('Fashion', 'Lagos', 23000, 38000, 56000),
  ('Dance & Choreography', 'Lagos', 19000, 31000, 50000),
  ('Beauty & Skincare', 'Lagos', 25000, 40000, 63000),
  ('Food & Cooking', 'Lagos', 19000, 31000, 50000),
  ('Finance & Fintech', 'Lagos', 38000, 56000, 88000),
  ('SaaS / Tech', 'Lagos', 38000, 56000, 88000),
  ('*', 'FCT - Abuja', 19000, 31000, 56000),
  ('Lifestyle', 'FCT - Abuja', 19000, 31000, 50000),
  ('Fashion', 'FCT - Abuja', 23000, 38000, 56000),
  ('Dance & Choreography', 'FCT - Abuja', 19000, 31000, 50000),
  ('Beauty & Skincare', 'FCT - Abuja', 25000, 40000, 63000),
  ('Food & Cooking', 'FCT - Abuja', 19000, 31000, 50000),
  ('Finance & Fintech', 'FCT - Abuja', 38000, 56000, 88000),
  ('SaaS / Tech', 'FCT - Abuja', 38000, 56000, 88000)
on conflict (niche, location) do nothing;
