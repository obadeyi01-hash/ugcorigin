-- Lookup used by the email sign-in form before it sends anything.
-- Tells the server whether this address already belongs to Google (or another
-- provider), is suspended, or was just sent a link. Granted to service_role
-- only, so the public API cannot enumerate accounts.

create or replace function public.auth_email_sign_in_hint(target text)
returns jsonb
language plpgsql
stable
security definer
set search_path = auth, public
as $$
declare
  uid uuid;
  is_banned boolean;
  sent_at timestamptz;
  providers text[];
begin
  if target is null or length(btrim(target)) = 0 or length(btrim(target)) > 254 then
    return jsonb_build_object('exists', false);
  end if;

  select u.id,
         (u.banned_until is not null and u.banned_until > now()),
         u.recovery_sent_at
    into uid, is_banned, sent_at
  from auth.users u
  where lower(u.email) = lower(btrim(target))
  limit 1;

  if uid is null then
    return jsonb_build_object('exists', false);
  end if;

  select coalesce(array_agg(distinct i.provider), array[]::text[])
    into providers
  from auth.identities i
  where i.user_id = uid;

  return jsonb_build_object(
    'exists', true,
    'banned', coalesce(is_banned, false),
    'providers', to_jsonb(providers),
    'recovery_sent_at', sent_at
  );
end;
$$;

revoke all on function public.auth_email_sign_in_hint(text) from public;
revoke all on function public.auth_email_sign_in_hint(text) from anon;
revoke all on function public.auth_email_sign_in_hint(text) from authenticated;
grant execute on function public.auth_email_sign_in_hint(text) to service_role;

-- Our own mailer does not go through GoTrue's send timer, so record the send
-- here. A second request inside a minute then stops before another email goes out.
create or replace function public.auth_email_mark_link_sent(target text)
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  if target is null or length(btrim(target)) = 0 or length(btrim(target)) > 254 then
    return;
  end if;
  update auth.users
     set recovery_sent_at = now()
   where lower(email) = lower(btrim(target));
end;
$$;

revoke all on function public.auth_email_mark_link_sent(text) from public;
revoke all on function public.auth_email_mark_link_sent(text) from anon;
revoke all on function public.auth_email_mark_link_sent(text) from authenticated;
grant execute on function public.auth_email_mark_link_sent(text) to service_role;
