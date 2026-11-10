-- The website (Next.js on the GIP server) caches the published projects and plots for up to a minute. After any save to
-- projects or units the database asks it to drop that cache at once (POST /api/revalidate with a shared secret), so the
-- next visit shows the change. The URL and the secret are the Vault secrets 'site_revalidate_url' and
-- 'site_revalidate_secret', set on the server only; without them nothing is sent. pg_net sends after the commit, so
-- the website reads the saved data. Nothing here can block an edit.

create function private.revalidate_site() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'site_revalidate_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'site_revalidate_secret';
  if v_url is not null and v_secret is not null then
    perform net.http_post(
      url := v_url,
      body := '{}'::jsonb,
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-revalidate-secret', v_secret),
      timeout_milliseconds := 5000
    );
  end if;
  return null;
exception when others then
  return null; -- a website problem must never block a save
end $$;
revoke all on function private.revalidate_site() from public, anon, authenticated;

create trigger projects_revalidate_site after insert or update or delete on public.projects
  for each statement execute function private.revalidate_site();
create trigger units_revalidate_site after insert or update or delete on public.units
  for each statement execute function private.revalidate_site();
