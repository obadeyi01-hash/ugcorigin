-- Tax is collected on each brand charge, on top of the creator's rate and the
-- platform fee. The rate lives in one admin setting. Each transaction stores
-- the naira amount collected, so a later rate change does not rewrite old charges.

create table if not exists public.platform_settings (
  id smallint primary key default 1 check (id = 1),
  tax_bps integer not null default 750 check (tax_bps >= 0 and tax_bps <= 2500),
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id, tax_bps)
values (1, 750)
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;
revoke all on public.platform_settings from anon, authenticated;

alter table public.gigs add column if not exists tax_naira integer not null default 0;
alter table public.escrow_transactions add column if not exists tax_naira integer not null default 0;
alter table public.campaigns add column if not exists tax_naira integer not null default 0;

comment on column public.platform_settings.tax_bps is
  'Tax rate in basis points. 750 = 7.5%. Applied to the creator rate or campaign pool on each new charge.';
