-- ============================================================================
-- UGCOrigin — active-load (availability) signal.
--
-- While a creator is actively carrying jobs, they should surface a little lower
-- so they aren't over-booked and availability is rewarded; as they finish the
-- work the weight lifts automatically. This is a soft, reversible SERVING nudge
-- (applied in lib/ranking.ts) — never a tier change — so it can't scar a
-- creator's standing.
--
-- We keep a live count of in-flight gigs on creator_metrics, maintained by a
-- trigger on gigs so it stays fresh on both new funding (INSERT) and every
-- status change (UPDATE), including when a gig finishes and the load drops.
-- ============================================================================

alter table public.creator_metrics
  add column if not exists active_gigs integer not null default 0;

-- The "carrying work" states. pending_acceptance (not started) and the terminal
-- states (approved/released/completed/cancelled/declined/disputed) are excluded.
create or replace function public.refresh_active_load(cid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.creator_metrics as m (creator_id, active_gigs, updated_at)
  values (
    cid,
    (select count(*) from public.gigs
      where creator_id = cid
        and status in ('funded','in_progress','in_review','revision')),
    now()
  )
  on conflict (creator_id) do update set
    active_gigs = excluded.active_gigs,
    updated_at  = now();
end;
$$;

create or replace function public.trg_gig_active_load_fn()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.refresh_active_load(new.creator_id);
  return new;
end;
$$;

drop trigger if exists trg_gig_active_load on public.gigs;
create trigger trg_gig_active_load
  after insert or update of status on public.gigs
  for each row execute function public.trg_gig_active_load_fn();

revoke execute on function public.refresh_active_load(uuid) from public, anon, authenticated;
grant execute on function public.refresh_active_load(uuid) to service_role;

-- Backfill current load for every creator who has gigs.
do $$
declare r record;
begin
  for r in select distinct creator_id from public.gigs loop
    perform public.refresh_active_load(r.creator_id);
  end loop;
end $$;
