-- Enable Supabase Realtime for notifications so the header bell updates live.
-- RLS still applies to realtime, so users only receive their own notifications.
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end $$;
