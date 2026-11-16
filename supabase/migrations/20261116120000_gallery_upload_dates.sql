-- Every gallery photo carries the date it was uploaded (content.media.gallery[].uploadedAt, ISO UTC), and the website's
-- "Photographs from the site, last updated …" line shows the newest one (client, 16 Nov 2026).
-- The database stamps it, so it holds however a photo gets in: a photo without a stamp keeps the one it had before
-- (same asset id) or gets the time of this save.

-- 1. The photos already there: an admin upload (bucket project-media) is dated by its storage object; the client's
--    original WhatsApp pictures by the date in their file name.
update public.projects p
set content = jsonb_set(p.content, '{media,gallery}', (
  select coalesce(jsonb_agg(
    case
      when e ? 'uploadedAt' then e
      else e || coalesce(
        (select jsonb_build_object('uploadedAt', to_char(o.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
           from storage.objects o
          where o.bucket_id = 'project-media' and e->>'url' like '%/project-media/' || o.name
          limit 1),
        (select jsonb_build_object('uploadedAt', m[1] || 'T00:00:00Z')
           from regexp_match(e->>'name', '(\d{4}-\d{2}-\d{2})') m
          where m is not null),
        '{}'::jsonb)
    end order by i), '[]'::jsonb)
  from jsonb_array_elements(p.content->'media'->'gallery') with ordinality t(e, i)))
where jsonb_typeof(p.content->'media'->'gallery') = 'array';

-- 2. From now on, on every insert and save.
create or replace function private.stamp_gallery_uploads()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  before_g jsonb := case when tg_op = 'UPDATE' then old.content->'media'->'gallery' end;
  now_iso text := to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
begin
  if jsonb_typeof(new.content->'media'->'gallery') is distinct from 'array' then
    return new;
  end if;
  new.content := jsonb_set(new.content, '{media,gallery}', (
    select coalesce(jsonb_agg(
      case
        when e ? 'uploadedAt' then e
        else e || jsonb_build_object('uploadedAt', coalesce(
          (select b->>'uploadedAt'
             from jsonb_array_elements(coalesce(before_g, '[]'::jsonb)) b
            where b->>'id' = e->>'id' and b ? 'uploadedAt'
            limit 1),
          now_iso))
      end order by i), '[]'::jsonb)
    from jsonb_array_elements(new.content->'media'->'gallery') with ordinality t(e, i)));
  return new;
end
$$;

drop trigger if exists projects_stamp_gallery on public.projects;
create trigger projects_stamp_gallery
  before insert or update of content on public.projects
  for each row execute function private.stamp_gallery_uploads();
