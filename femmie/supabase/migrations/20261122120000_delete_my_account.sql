-- Account deletion (App Store guideline 5.1.1(v)).
--
-- Deletes the calling user's auth record. public.logs and public.key_material
-- reference auth.users(id) ON DELETE CASCADE, and auth.sessions / identities /
-- refresh tokens cascade inside the auth schema, so one delete removes the
-- account, every ciphertext row, and every live session.
--
-- SECURITY DEFINER because the authenticated role cannot touch auth.users.
-- It can only ever delete auth.uid(): no argument, no way to target another user.
--
-- When Sign in with Apple is enabled, the Apple token must also be revoked
-- (TN3194). That needs the Apple private key, so it belongs in an Edge Function
-- that calls this after revoking.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
