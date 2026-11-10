-- The website (GitHub Pages) is a build-time copy of the published projects and plots, so an admin edit only shows
-- after a rebuild. GitHub's own timer (the workflow's schedule) proved unreliable, so the database asks for the rebuild
-- itself: any change to projects or units marks the site stale, and a pg_cron job each minute asks GitHub for one
-- rebuild once the edits have been quiet for 30 seconds (a burst of saves is one build). The workflow still skips the
-- build when the published data turns out unchanged (a draft edit).
--
-- The GitHub token is the Vault secret 'github_dispatch_token' (fine-grained, this repository only, Actions: read and
-- write), set on the hosted project only, so a local database never calls GitHub. GitHub's answers are in
-- net._http_response (204 = rebuild started).

create extension if not exists pg_cron with schema pg_catalog;

create table private.site_rebuild (
  id boolean primary key default true check (id), -- one row
  changed_at timestamptz,                         -- last change to what the website reads
  requested_at timestamptz                        -- last rebuild asked of GitHub
);
insert into private.site_rebuild default values;
revoke all on private.site_rebuild from public, anon, authenticated;

create function private.mark_site_stale() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update private.site_rebuild set changed_at = now();
  return null;
exception when others then
  return null; -- never block an edit
end $$;

create trigger projects_site_stale after insert or update or delete on public.projects
  for each statement execute function private.mark_site_stale();
create trigger units_site_stale after insert or update or delete on public.units
  for each statement execute function private.mark_site_stale();

create function private.request_site_rebuild() returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_token text;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets where name = 'github_dispatch_token';
  if v_token is null then
    return;
  end if;
  -- Claim: changed since the last request, and quiet for 30 seconds.
  update private.site_rebuild set requested_at = now()
  where changed_at < now() - interval '30 seconds' and (requested_at is null or changed_at > requested_at);
  if not found then
    return;
  end if;
  perform net.http_post(
    url := 'https://api.github.com/repos/Gjagadish123/gip-platform/actions/workflows/deploy-admin-pages.yml/dispatches',
    body := jsonb_build_object('ref', 'main', 'inputs', jsonb_build_object('only_if_changed', 'true')),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_token,
      'Accept', 'application/vnd.github+json',
      'X-GitHub-Api-Version', '2022-11-28',
      'User-Agent', 'gip-site-rebuild',
      'Content-Type', 'application/json'
    ),
    timeout_milliseconds := 10000
  );
end $$;

revoke all on function private.mark_site_stale(), private.request_site_rebuild() from public, anon, authenticated;

select cron.schedule('site-rebuild', '* * * * *', 'select private.request_site_rebuild()');
