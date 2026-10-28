-- GIP admin backend: projects, unit inventory (now with the Hold status), status history, activity log, media bucket.
--
-- Access model
--   Admins: users whose auth.users app_metadata.role is 'admin' (set by an operator, never by the user), checked
--           against the live row on every statement. They read and write everything.
--   Website: anon reads the listing columns of published projects and the public columns of their units. Nothing
--           else; other signed-in users see nothing.
-- Every grant is explicit and starts from a revoke, so the result doesn't depend on the project's "Automatically
-- expose new tables" setting (hosted projects stop exposing new tables by default on 2026-10-30).
--
-- Write paths
--   projects            plain table writes from the admin (the editor saves `content` whole, guarded by updated_at).
--   units               only through the RPCs at the bottom, so every change is atomic with its history, activity
--                       and the project's inventory stamp, and refuses to act on a stale view of the units.
--   unit_status_events  written by the units trigger (and by the RPCs when they restore removed units).

create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

/* ---------- helpers ---------- */

-- Reads the live user row, so removing the role or deleting the user takes effect at once instead of when their
-- token expires (up to an hour). security definer only to read auth.users; it is in the unexposed private schema,
-- looks at nobody but the caller, and only signed-in roles may run it.
create function private.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from auth.users u where u.id = auth.uid() and u.raw_app_meta_data ->> 'role' = 'admin')
$$;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated, service_role;

-- Display name for history and activity. user_metadata is user-editable: fine for a label, never for access.
create function private.actor_name() returns text
language sql stable set search_path = ''
as $$ select coalesce(auth.jwt() -> 'user_metadata' ->> 'name', auth.jwt() ->> 'email', 'Admin') $$;

create function private.today_ist() returns date
language sql stable set search_path = ''
as $$ select (now() at time zone 'Asia/Kolkata')::date $$;

create function private.set_updated_at() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end $$;

/* ---------- types ---------- */

-- Client order (legend, keys 1–5) lives in admin/src/lib/constants.ts; enum order here is irrelevant.
create type public.unit_status as enum ('available', 'hold', 'sold_out', 'mortgaged', 'registered');
create type public.project_lifecycle as enum ('upcoming', 'ongoing', 'completed');
create type public.publish_state as enum ('draft', 'published', 'archived');
create domain public.facing as text
  check (value in ('East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'));

/* ---------- projects ---------- */

-- What the website may read of a project's content: all of it, except the price (the project's and each
-- configuration's) while it is hidden on the website, and legal documents not listed on the page. Immutable, so it
-- can feed the generated column below.
create function private.public_content(c jsonb) returns jsonb
language sql immutable set search_path = ''
as $$
  select jsonb_set(
    case when coalesce((c ->> 'showPrice')::boolean, false) then c
      else (c - 'price' - 'priceLabel') || case when jsonb_typeof(c -> 'configurations') = 'array' then
        jsonb_build_object('configurations',
          coalesce((select jsonb_agg(e - 'price') from jsonb_array_elements(c -> 'configurations') e), '[]'::jsonb))
        else '{}'::jsonb end
    end,
    '{legal,documents}',
    coalesce((select jsonb_agg(d) from jsonb_array_elements(
      case when jsonb_typeof(c #> '{legal,documents}') = 'array' then c #> '{legal,documents}' else '[]'::jsonb end) d
      where coalesce((d ->> 'available')::boolean, false)), '[]'::jsonb),
    false)
$$;

create table public.projects (
  id text primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  type_id text not null,
  lifecycle public.project_lifecycle not null default 'upcoming',
  publish_state public.publish_state not null default 'draft',
  homepage_slot text check (homepage_slot in ('large', 'small')),
  sort_order integer not null default 0,
  -- Every other Project field (copy, pricing, location, media, page sections, SEO), exactly as the admin edits it:
  -- admin/src/lib/types.ts Project minus the columns of this table. See admin/src/lib/supabase/rows.ts.
  content jsonb not null default '{}' check (jsonb_typeof(content) = 'object'),
  public_content jsonb generated always as (private.public_content(content)) stored, -- the website's copy (anon)
  inventory_updated_at date,                     -- "Status as of …" on the website
  status_sample boolean not null default false,  -- some unit statuses are sample data, not client-confirmed
  sample boolean not null default false,         -- the whole project is demo data
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

-- Edits bump updated_at; inventory stamps (inventory_updated_at, status_sample) don't, so the list's "Edited" date
-- stays an editorial date.
create function private.stamp_project() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.publish_state = 'published' and old.publish_state <> 'published' then
    new.published_at := now();
  end if;
  return new;
end $$;

create trigger projects_stamp
  before update of slug, name, type_id, lifecycle, publish_state, homepage_slot, sort_order, content
  on public.projects
  for each row execute function private.stamp_project();

/* ---------- units ---------- */

create table public.units (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects (id) on delete cascade,
  number text not null check (char_length(btrim(number)) between 1 and 20),
  block text,
  area numeric not null check (area > 0),        -- in the project type's area unit (sq yd for plots)
  width_ft numeric check (width_ft > 0),
  depth_ft numeric check (depth_ft > 0),
  facing public.facing,
  facing2 public.facing,
  road_width_ft numeric check (road_width_ft > 0),
  road_width2_ft numeric check (road_width2_ft > 0),
  corner boolean,
  built_up_area_sqft numeric check (built_up_area_sqft > 0),
  bedrooms smallint check (bedrooms >= 0),
  tower text,
  floor smallint,
  bhk numeric(3, 1) check (bhk > 0),             -- 2.5 BHK exists
  carpet_area_sqft numeric check (carpet_area_sqft > 0),
  price bigint check (price >= 0),               -- ₹ total override; default is area × the project's rate
  status public.unit_status not null default 'available',
  status_date date,
  status_note text,
  mortgaged_to text check (mortgaged_to in ('HMDA', 'DTCP', 'Gram Panchayat', 'Bank', 'Other')),
  document_no text,                              -- sale deed number
  sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, number),
  constraint units_mortgaged_to_needs_mortgaged check (mortgaged_to is null or status = 'mortgaged'),
  constraint units_document_no_needs_registered check (document_no is null or status = 'registered')
);

create trigger units_updated_at before update on public.units
  for each row execute function private.set_updated_at();

/* ---------- status history ---------- */

create table public.unit_status_events (
  id bigint generated always as identity primary key,
  unit_id uuid not null references public.units (id) on delete cascade,
  from_status public.unit_status,                -- null: the unit was added with to_status
  to_status public.unit_status not null,
  at timestamptz not null default now(),
  actor_id uuid default auth.uid(),                -- no FK: the audit keeps the id after a user is deleted
  actor_name text not null default private.actor_name(),
  note text,
  batch_id text,                                 -- shared by the events of one bulk change (activity, undo)
  prev jsonb                                     -- the unit's status fields before this change, for undo
);

create index unit_status_events_unit_at on public.unit_status_events (unit_id, at);
create index unit_status_events_batch on public.unit_status_events (batch_id) where batch_id is not null;

-- Every status change is logged here, whoever makes it (RPC, Studio, a script). The RPCs pass the bulk change's
-- batch id in gip.batch_id; restoring saved history sets gip.skip_history so nothing is logged twice.
create function private.log_unit_status() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_setting('gip.skip_history', true) = 'on' then
    return null;
  end if;
  insert into public.unit_status_events (unit_id, from_status, to_status, note, batch_id, prev)
  values (
    new.id,
    case when tg_op = 'UPDATE' then old.status end,
    new.status,
    new.status_note,
    nullif(current_setting('gip.batch_id', true), ''),
    case when tg_op = 'UPDATE' then jsonb_build_object(
      'status', old.status, 'status_date', old.status_date, 'status_note', old.status_note,
      'mortgaged_to', old.mortgaged_to, 'document_no', old.document_no, 'sample', old.sample
    ) end
  );
  return null;
end $$;

create trigger units_log_insert after insert on public.units
  for each row execute function private.log_unit_status();
create trigger units_log_status after update of status on public.units
  for each row when (old.status is distinct from new.status) execute function private.log_unit_status();

/* ---------- activity ---------- */

create table public.activity (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid default auth.uid(),                -- no FK: the audit keeps the id after a user is deleted
  actor_name text not null default private.actor_name(),
  project_id text not null,                      -- no FK: "Deleted Global City VI" outlives the project
  kind text not null check (kind in ('status', 'project')),
  message text not null,
  batch_id text,
  unit_numbers text[],
  to_status public.unit_status
);

create index activity_at on public.activity (at desc);
create index activity_batch on public.activity (batch_id) where batch_id is not null;

/* ---------- row level security ---------- */

alter table public.projects enable row level security;
alter table public.units enable row level security;
alter table public.unit_status_events enable row level security;
alter table public.activity enable row level security;

create policy "Website reads published projects" on public.projects
  for select to anon using (publish_state = 'published');
create policy "Admins read projects" on public.projects
  for select to authenticated using ((select private.is_admin()));
create policy "Admins add projects" on public.projects
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admins edit projects" on public.projects
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete projects" on public.projects
  for delete to authenticated using ((select private.is_admin()));

create policy "Website reads units of published projects" on public.units
  for select to anon
  using (exists (select 1 from public.projects p where p.id = project_id and p.publish_state = 'published'));
create policy "Admins read units" on public.units
  for select to authenticated using ((select private.is_admin()));
create policy "Admins add units" on public.units
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admins edit units" on public.units
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete units" on public.units
  for delete to authenticated using ((select private.is_admin()));

create policy "Admins only" on public.unit_status_events
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins only" on public.activity
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

/* ---------- grants ---------- */

-- Start from nothing, whatever the project's auto-expose setting granted (a table-level revoke also drops column
-- grants, so it comes first), then give each role only what it needs.
revoke all on public.projects, public.units, public.unit_status_events, public.activity
  from public, anon, authenticated, service_role;
-- Website: the listing columns and `public_content` (content minus a hidden price and unlisted documents). The raw
-- `content` and the units' notes, mortgagee, sale deed numbers and prices stay with the admins.
grant select (
  id, slug, name, type_id, lifecycle, publish_state, homepage_slot, sort_order, public_content, inventory_updated_at,
  status_sample, sample, published_at, updated_at
) on public.projects to anon;
grant select (
  id, project_id, number, block, area, width_ft, depth_ft, facing, facing2, road_width_ft, road_width2_ft, corner,
  built_up_area_sqft, bedrooms, tower, floor, bhk, carpet_area_sqft, status, status_date, sample
) on public.units to anon;
grant select, insert, update, delete on public.projects, public.units, public.unit_status_events, public.activity
  to authenticated, service_role;

/* ---------- unit RPCs (security invoker: RLS applies, so only admins get through) ---------- */

-- Inserts units from rows shaped like public.units. A number that already exists fails (23505), so an add made on a
-- stale screen can't overwrite another admin's unit.
-- p_with_history: restoring removed units (undo). Each row then carries its "history" (the admin's StatusEvents:
-- {from, to, at, by, note, batchId, prev}), written as is, without the trigger logging them again. prev is the
-- trigger's own snapshot, round-tripped by the admin; events that never had one keep at least the status.
-- Otherwise the trigger logs each new unit's creation under the caller and the current batch.
create function private.insert_units(p_project_id text, p_units jsonb, p_with_history boolean) returns void
language plpgsql set search_path = ''
as $$
declare
  skip text := current_setting('gip.skip_history', true);
begin
  if p_with_history then
    perform set_config('gip.skip_history', 'on', true);
  end if;
  with added as (
    insert into public.units (
      project_id, number, block, area, width_ft, depth_ft, facing, facing2, road_width_ft, road_width2_ft, corner,
      built_up_area_sqft, bedrooms, tower, floor, bhk, carpet_area_sqft, price,
      status, status_date, status_note, mortgaged_to, document_no, sample
    )
    select
      p_project_id, r.number, r.block, r.area, r.width_ft, r.depth_ft, r.facing, r.facing2, r.road_width_ft,
      r.road_width2_ft, r.corner, r.built_up_area_sqft, r.bedrooms, r.tower, r.floor, r.bhk, r.carpet_area_sqft,
      r.price, coalesce(r.status, 'available'), r.status_date, r.status_note, r.mortgaged_to, r.document_no,
      coalesce(r.sample, false)
    from jsonb_array_elements(p_units) x
    cross join lateral jsonb_populate_record(null::public.units, x) r
    returning id, number
  )
  insert into public.unit_status_events (unit_id, from_status, to_status, at, actor_id, actor_name, note, batch_id, prev)
  select
    a.id, (h ->> 'from')::public.unit_status, (h ->> 'to')::public.unit_status, coalesce((h ->> 'at')::timestamptz, now()),
    null, coalesce(h ->> 'by', private.actor_name()), h ->> 'note', h ->> 'batchId',
    coalesce(nullif(h -> 'prev', 'null'), case when h ->> 'from' is not null then jsonb_build_object('status', h ->> 'from') end)
  from added a
  join jsonb_array_elements(p_units) x on x ->> 'number' = a.number
  cross join lateral jsonb_array_elements(coalesce(x -> 'history', '[]')) h
  where p_with_history;
  perform set_config('gip.skip_history', coalesce(skip, ''), true);
end $$;

-- Refuses (40001) when a listed unit's status is no longer what the admin's screen showed. Units already gone pass.
create function private.assert_seen(p_project_id text, p_numbers text[], p_statuses public.unit_status[]) returns void
language plpgsql set search_path = ''
as $$
begin
  if exists (
    select 1 from unnest(p_numbers, p_statuses) s(number, status)
    join public.units u on u.project_id = p_project_id and u.number = s.number
    where u.status <> s.status
  ) then
    raise exception 'Some of these units were changed by another admin, so make the change again' using errcode = '40001';
  end if;
end $$;

create function private.touch_inventory(p_project_id text) returns void
language sql set search_path = ''
as $$
  update public.projects p
  set inventory_updated_at = private.today_ist(),
      status_sample = exists (select 1 from public.units u where u.project_id = p.id and u.sample)
  where p.id = p_project_id;
$$;

-- Bulk status change (the inventory's main action). Units already in p_to are skipped, like the admin does.
-- p_from: the status the admin saw on each unit (same order as p_numbers). If another admin changed or removed one
-- of them meanwhile the whole change fails (40001) and the admin reloads, instead of silently reverting a sale.
-- Returns how many units changed; 0 writes nothing.
create function public.set_unit_statuses(
  p_project_id text,
  p_numbers text[],
  p_to public.unit_status,
  p_batch_id text,
  p_message text,
  p_note text default null,
  p_date date default null,
  p_mortgaged_to text default null,
  p_document_no text default null,
  p_from public.unit_status[] default null
) returns integer
language plpgsql set search_path = ''
as $$
declare
  changed text[];
begin
  perform set_config('gip.batch_id', p_batch_id, true);
  with upd as (
    update public.units u set
      status = p_to,
      status_date = coalesce(p_date, private.today_ist()),
      status_note = nullif(btrim(p_note), ''),
      mortgaged_to = case when p_to = 'mortgaged' then coalesce(p_mortgaged_to, u.mortgaged_to) end,
      document_no = case when p_to = 'registered' then coalesce(p_document_no, u.document_no) end,
      sample = false
    from unnest(p_numbers, p_from) as seen(number, status)
    where u.project_id = p_project_id and u.number = seen.number and u.status <> p_to
      and (seen.status is null or u.status = seen.status)
    returning u.number
  )
  select array_agg(number) into changed from upd;
  if p_from is not null and exists (
    select 1 from unnest(p_numbers) n(number)
    where n.number <> all (coalesce(changed, '{}'))
      and not exists (select 1 from public.units u where u.project_id = p_project_id and u.number = n.number and u.status = p_to)
  ) then
    raise exception 'Some of these units were changed or removed by another admin, so make the change again'
      using errcode = '40001';
  end if;
  if changed is null then
    return 0;
  end if;
  insert into public.activity (project_id, kind, message, batch_id, unit_numbers, to_status)
  values (p_project_id, 'status', p_message, p_batch_id, changed, p_to);
  perform private.touch_inventory(p_project_id);
  return cardinality(changed);
end $$;

-- Add or edit one unit. p_unit is a units row. An edit also carries "number_was" (its number before this edit, for
-- renames) and "status_was" (the status the admin saw); it fails (40001) if another admin changed that status or
-- removed the unit meanwhile, so a details fix can't silently undo a sale. An add (no number_was) is insert-only.
-- p_message is the activity line when the status changed, else null.
create function public.save_unit(p_project_id text, p_unit jsonb, p_message text default null) returns void
language plpgsql set search_path = ''
as $$
begin
  perform set_config('gip.batch_id', '', true); -- a single edit is not part of any batch
  if p_unit ? 'number_was' then
    update public.units u set (
      number, block, area, width_ft, depth_ft, facing, facing2, road_width_ft, road_width2_ft, corner,
      built_up_area_sqft, bedrooms, tower, floor, bhk, carpet_area_sqft, price,
      status, status_date, status_note, mortgaged_to, document_no, sample
    ) = (
      r.number, r.block, r.area, r.width_ft, r.depth_ft, r.facing, r.facing2, r.road_width_ft, r.road_width2_ft, r.corner,
      r.built_up_area_sqft, r.bedrooms, r.tower, r.floor, r.bhk, r.carpet_area_sqft, r.price,
      r.status, r.status_date, r.status_note, r.mortgaged_to, r.document_no, coalesce(r.sample, false)
    )
    from jsonb_populate_record(null::public.units, p_unit) r
    where u.project_id = p_project_id and u.number = p_unit ->> 'number_was'
      and u.status = (p_unit ->> 'status_was')::public.unit_status;
    if not found then
      raise exception 'Unit % was changed or removed by another admin, so make the change again', p_unit ->> 'number_was'
        using errcode = '40001';
    end if;
  else
    perform private.insert_units(p_project_id, jsonb_build_array(p_unit), false);
  end if;
  if p_message is not null then
    insert into public.activity (project_id, kind, message, unit_numbers, to_status)
    values (p_project_id, 'status', p_message, array[p_unit ->> 'number'], (p_unit ->> 'status')::public.unit_status);
    perform private.touch_inventory(p_project_id);
  end if;
end $$;

-- Generate, import or remove units, as a change: p_remove are numbers to delete (with their history), p_add new units
-- (insert-only). Units in neither are never touched, so a stale screen can't revert other admins' work.
-- p_remove_from: the status the admin saw on each removed unit; a sale made meanwhile stops the removal.
create function public.replace_units(
  p_project_id text, p_add jsonb, p_remove text[], p_batch_id text, p_message text,
  p_remove_from public.unit_status[] default null
) returns void
language plpgsql set search_path = ''
as $$
begin
  perform set_config('gip.batch_id', p_batch_id, true);
  perform private.assert_seen(p_project_id, p_remove, p_remove_from);
  delete from public.units u where u.project_id = p_project_id and u.number = any (coalesce(p_remove, '{}'));
  perform private.insert_units(p_project_id, coalesce(p_add, '[]'), false);
  insert into public.activity (project_id, kind, message, batch_id)
  values (p_project_id, 'project', p_message, p_batch_id);
  perform private.touch_inventory(p_project_id);
end $$;

-- Undo one batch and drop its activity.
-- A status batch reverts the units still sitting on it (later edits survive).
-- A replace batch passes its inverse: p_remove = the numbers it added (p_remove_from: their status on screen, as in
-- replace_units), p_add = the units it removed (with their history), so only what that batch touched changes.
create function public.undo_batch(
  p_batch_id text, p_project_id text, p_add jsonb default null, p_remove text[] default null,
  p_remove_from public.unit_status[] default null
) returns void
language plpgsql set search_path = ''
as $$
declare
  skip text := current_setting('gip.skip_history', true);
begin
  if p_add is not null or p_remove is not null then
    perform private.assert_seen(p_project_id, p_remove, p_remove_from);
    delete from public.units u where u.project_id = p_project_id and u.number = any (coalesce(p_remove, '{}'));
    perform private.insert_units(p_project_id, coalesce(p_add, '[]'), true);
  else
    perform set_config('gip.skip_history', 'on', true);
    with latest as (
      select distinct on (e.unit_id) e.id, e.unit_id, e.batch_id, e.prev
      from public.unit_status_events e
      join public.units u on u.id = e.unit_id
      where u.project_id = p_project_id
      order by e.unit_id, e.at desc, e.id desc
    ), reverted as (
      update public.units u set
        status = (l.prev ->> 'status')::public.unit_status,
        status_date = (l.prev ->> 'status_date')::date,
        status_note = l.prev ->> 'status_note',
        mortgaged_to = l.prev ->> 'mortgaged_to',
        document_no = l.prev ->> 'document_no',
        sample = coalesce((l.prev ->> 'sample')::boolean, false)
      from latest l
      where l.unit_id = u.id and l.batch_id = p_batch_id and l.prev is not null
      returning l.id
    )
    delete from public.unit_status_events e using reverted r where e.id = r.id;
    perform set_config('gip.skip_history', coalesce(skip, ''), true);
  end if;
  delete from public.activity where batch_id = p_batch_id;
  perform private.touch_inventory(p_project_id);
end $$;

revoke execute on function
  public.set_unit_statuses(text, text[], public.unit_status, text, text, text, date, text, text, public.unit_status[]),
  public.save_unit(text, jsonb, text),
  public.replace_units(text, jsonb, text[], text, text, public.unit_status[]),
  public.undo_batch(text, text, jsonb, text[], public.unit_status[])
from public, anon;
grant execute on function
  public.set_unit_statuses(text, text[], public.unit_status, text, text, text, date, text, text, public.unit_status[]),
  public.save_unit(text, jsonb, text),
  public.replace_units(text, jsonb, text[], text, text, public.unit_status[]),
  public.undo_batch(text, text, jsonb, text[], public.unit_status[])
to authenticated, service_role;

/* ---------- media ---------- */

-- Public bucket: the website shows these files by URL. Only admins write. 20 MB matches the admin's dropzone.
-- No SVG: an uploaded SVG can carry script.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-media', 'project-media', true, 20 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'application/pdf']
)
on conflict (id) do nothing;

create policy "Admins manage project media" on storage.objects
  for all to authenticated
  using (bucket_id = 'project-media' and (select private.is_admin()))
  with check (bucket_id = 'project-media' and (select private.is_admin()));
