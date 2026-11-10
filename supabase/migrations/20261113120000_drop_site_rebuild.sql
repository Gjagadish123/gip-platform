-- The website moved off GitHub Pages to its own server, which reads Supabase as visitors arrive, so the rebuild
-- requests of 20261112120000_site_rebuild.sql (never switched on: no GitHub token was stored) are removed.
-- pg_cron stays installed.

select cron.unschedule('site-rebuild');
drop trigger projects_site_stale on public.projects;
drop trigger units_site_stale on public.units;
drop function private.request_site_rebuild();
drop function private.mark_site_stale();
drop table private.site_rebuild;
