-- Live layouts: the website's /layouts page follows the admin in real time, and the inventory's guarded status
-- changes are enforced by the database as well as by the admin UI.
--
-- Broadcast
--   Every change to the status, status date or sample flag of a published project's units is sent on the private
--   Realtime channel "live-layouts" as one message per statement (a bulk change of 40 plots is one message):
--   event "units", payload {project_id, units: [{number, status, from, status_date, sample}]} ("from" is the status
--   before, so a date-only edit is not announced as a sale). These are columns anon can already read through the API
--   for published projects; nothing about drafts, notes, buyers or prices is sent. Units added or removed, or edited
--   in what the site shows (number, area, size, facing, road, corner), send "units_reset" {project_id} so pages
--   re-read through RLS. A project published,
--   unpublished, deleted or moved to another lifecycle sends "project" {id, published, lifecycle}.
--   Sending is best effort: a Realtime failure never blocks the admin's change (pages also re-read on reconnect).
--   The channel is private so that pages can only listen: anon and signed-in users may receive its broadcasts (policy
--   below) and nobody may send (no insert policy), so a visitor holding the publishable key cannot fake a change.
--
-- Guards (the same rules as admin/src/lib/inventory.ts canTransition, which asks for a note in the UI)
--   Undoing a registration, or putting a sold unit back on sale, needs a note: set_unit_statuses and save_unit refuse
--   it without one (23514). Undo of a batch (undo_batch) is the system reverting its own change and is not guarded.

/* ---------- broadcast ---------- */

create function private.send_live(payload jsonb, event text) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform realtime.send(payload, event, 'live-layouts', true);
exception when others then
  raise warning 'live-layouts broadcast skipped: %', sqlerrm;
end $$;
revoke execute on function private.send_live(jsonb, text) from public, anon, authenticated;

create policy "Website receives live layouts" on realtime.messages
  for select to anon, authenticated
  using ((select realtime.topic()) = 'live-layouts' and extension = 'broadcast');

create function private.broadcast_unit_changes() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  r record;
  pid text;
begin
  for r in
    select n.project_id,
      jsonb_agg(jsonb_build_object('number', n.number, 'status', n.status, 'from', o.status, 'status_date', n.status_date, 'sample', n.sample)
        order by n.number) as units
    from new_rows n
    join old_rows o on o.id = n.id
    join public.projects p on p.id = n.project_id and p.publish_state = 'published'
    where (n.status, n.status_date, n.sample) is distinct from (o.status, o.status_date, o.sample)
    group by n.project_id
  loop
    perform private.send_live(jsonb_build_object('project_id', r.project_id, 'units', r.units), 'units');
  end loop;
  for pid in
    select distinct n.project_id
    from new_rows n
    join old_rows o on o.id = n.id
    join public.projects p on p.id = n.project_id and p.publish_state = 'published'
    where (n.number, n.area, n.width_ft, n.depth_ft, n.facing, n.facing2, n.road_width_ft, n.road_width2_ft, n.corner)
      is distinct from (o.number, o.area, o.width_ft, o.depth_ft, o.facing, o.facing2, o.road_width_ft, o.road_width2_ft, o.corner)
  loop
    perform private.send_live(jsonb_build_object('project_id', pid), 'units_reset');
  end loop;
  return null;
end $$;

create function private.broadcast_units_added() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  pid text;
begin
  for pid in select distinct n.project_id from new_rows n join public.projects p on p.id = n.project_id and p.publish_state = 'published'
  loop
    perform private.send_live(jsonb_build_object('project_id', pid), 'units_reset');
  end loop;
  return null;
end $$;

create function private.broadcast_units_removed() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  pid text;
begin
  for pid in select distinct o.project_id from old_rows o join public.projects p on p.id = o.project_id and p.publish_state = 'published'
  loop
    perform private.send_live(jsonb_build_object('project_id', pid), 'units_reset');
  end loop;
  return null;
end $$;

create trigger units_live_update after update on public.units
  referencing old table as old_rows new table as new_rows
  for each statement execute function private.broadcast_unit_changes();
create trigger units_live_insert after insert on public.units
  referencing new table as new_rows
  for each statement execute function private.broadcast_units_added();
create trigger units_live_delete after delete on public.units
  referencing old table as old_rows
  for each statement execute function private.broadcast_units_removed();

create function private.broadcast_project() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform private.send_live(jsonb_build_object('id', old.id, 'published', false, 'lifecycle', old.lifecycle), 'project');
    return null;
  end if;
  perform private.send_live(
    jsonb_build_object('id', new.id, 'published', new.publish_state = 'published', 'lifecycle', new.lifecycle), 'project');
  return null;
end $$;

-- Only changes that touch what the site shows: a draft that stays a draft sends nothing.
create trigger projects_live_update after update of publish_state, lifecycle on public.projects
  for each row
  when ((old.publish_state = 'published' or new.publish_state = 'published')
    and (old.publish_state, old.lifecycle) is distinct from (new.publish_state, new.lifecycle))
  execute function private.broadcast_project();
create trigger projects_live_delete after delete on public.projects
  for each row when (old.publish_state = 'published')
  execute function private.broadcast_project();

revoke execute on function private.broadcast_unit_changes(), private.broadcast_units_added(),
  private.broadcast_units_removed(), private.broadcast_project() from public, anon, authenticated;

/* ---------- guarded transitions ---------- */

create or replace function public.set_unit_statuses(
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
  -- Only units this call would change (a stale screen is answered below with 40001, not with a note request).
  if nullif(btrim(p_note), '') is null and exists (
    select 1 from public.units u
    join unnest(p_numbers, p_from) as seen(number, status) on u.number = seen.number
    where u.project_id = p_project_id and u.status <> p_to and (seen.status is null or u.status = seen.status)
      and (u.status = 'registered' or (u.status = 'sold_out' and p_to = 'available'))
  ) then
    raise exception 'Add a note: undoing a registration or putting a sold unit back on sale needs one'
      using errcode = '23514';
  end if;
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

create or replace function public.save_unit(p_project_id text, p_unit jsonb, p_message text default null) returns void
language plpgsql set search_path = ''
as $$
begin
  perform set_config('gip.batch_id', '', true); -- a single edit is not part of any batch
  if p_unit ? 'number_was' then
    -- Stale screen first (40001), then the note the change needs (23514).
    if not exists (
      select 1 from public.units u
      where u.project_id = p_project_id and u.number = p_unit ->> 'number_was'
        and u.status = (p_unit ->> 'status_was')::public.unit_status
    ) then
      raise exception 'Unit % was changed or removed by another admin, so make the change again', p_unit ->> 'number_was'
        using errcode = '40001';
    end if;
    if (p_unit ->> 'status') is distinct from (p_unit ->> 'status_was')
      and ((p_unit ->> 'status_was') = 'registered' or ((p_unit ->> 'status_was') = 'sold_out' and (p_unit ->> 'status') = 'available'))
      and nullif(btrim(p_unit ->> 'status_note'), '') is null
    then
      raise exception 'Add a note: undoing a registration or putting a sold unit back on sale needs one'
        using errcode = '23514';
    end if;
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
