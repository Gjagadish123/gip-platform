-- Live layouts: what the database broadcasts to the website's /layouts page, and the guarded status changes it now
-- enforces. Runs on the seeded local database (Global City VI published: plot 1 Available, 3 Registered, 37 Sold Out)
-- inside a transaction that is rolled back: `npm run db:test` from the repo root.
begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

insert into auth.users (id, email, raw_app_meta_data) values
  ('a0000000-0000-4000-8000-00000000001a', 'test-admin-2@gip.local', '{"role": "admin"}');

-- Messages sent by this test only (the seed's own inserts broadcast too, before this transaction began).
create function pg_temp.msgs(ev text, pid text) returns bigint language sql as $$
  select count(*) from realtime.messages
  where topic = 'live-layouts' and event = ev and coalesce(payload ->> 'project_id', payload ->> 'id') = pid
    and inserted_at >= now()::timestamp;
$$;
create function pg_temp.edit(n text, patch jsonb) returns jsonb language sql as $$
  select to_jsonb(u) || jsonb_build_object('number_was', u.number, 'status_was', u.status) || patch
  from public.units u where project_id = 'global-city-vi' and number = n;
$$;

select ok(
  exists (select 1 from pg_trigger where tgname = 'units_live_update' and tgrelid = 'public.units'::regclass),
  'units broadcast trigger installed'
);

set local role authenticated;
set local request.jwt.claims to '{"role": "authenticated", "sub": "a0000000-0000-4000-8000-00000000001a", "email": "test-admin-2@gip.local", "app_metadata": {"role": "admin"}, "user_metadata": {"name": "Admin"}}';

/* ---------- guards ---------- */

select throws_ok(
  $$ select public.set_unit_statuses('global-city-vi', array['3'], 'hold', 'g1', 'x', p_from => array['registered']::public.unit_status[]) $$,
  '23514', null, 'undoing a registration without a note is refused'
);
select throws_ok(
  $$ select public.set_unit_statuses('global-city-vi', array['37'], 'available', 'g2', 'x', p_note => '  ') $$,
  '23514', null, 'a sold plot back on sale with a blank note is refused'
);
select throws_ok(
  $$ select public.save_unit('global-city-vi', pg_temp.edit('3', '{"status": "available", "status_note": ""}'), 'x') $$,
  '23514', null, 'save_unit: undoing a registration without a note is refused'
);
select is(
  public.set_unit_statuses('global-city-vi', array['37'], 'available', 'g3', 'Marked plot 37 Available', 'Booking cancelled',
    p_from => array['sold_out']::public.unit_status[]),
  1, 'with a note the sold plot goes back on sale'
);
select is(
  public.set_unit_statuses('global-city-vi', array['1'], 'sold_out', 'g4', 'Marked plot 1 Sold Out', p_from => array['available']::public.unit_status[]),
  1, 'unguarded changes need no note'
);

/* ---------- broadcasts ---------- */

reset role;
select is(pg_temp.msgs('units', 'global-city-vi'), 2::bigint, 'one "units" message per status statement of a published project');
select ok(
  exists (
    select 1 from realtime.messages m, jsonb_array_elements(m.payload -> 'units') u
    where m.topic = 'live-layouts' and m.event = 'units' and m.inserted_at >= now()::timestamp and u ->> 'number' = '1' and u ->> 'status' = 'sold_out'
  ),
  'the message carries the plot number and its new status'
);
select ok(
  not exists (
    select 1 from realtime.messages m, jsonb_array_elements(m.payload -> 'units') u
    where m.topic = 'live-layouts' and (u ? 'status_note' or u ? 'price' or u ? 'document_no' or u ? 'mortgaged_to')
  ),
  'no private unit fields are broadcast'
);
select ok(
  (select bool_and(private) from realtime.messages where topic = 'live-layouts' and inserted_at >= now()::timestamp),
  'sent on the private channel'
);

set local role authenticated;
set local request.jwt.claims to '{"role": "authenticated", "sub": "a0000000-0000-4000-8000-00000000001a", "email": "test-admin-2@gip.local", "app_metadata": {"role": "admin"}}';
insert into public.projects (id, slug, name, type_id) values ('test-draft-live', 'test-draft-live', 'Draft', 'open-plots');
select public.save_unit('test-draft-live', '{"number": "1", "area": 200, "status": "available"}');
select public.set_unit_statuses('test-draft-live', array['1'], 'sold_out', 'g5', 'x');
select public.save_unit('global-city-vi', '{"number": "T1", "area": 150, "status": "available"}');
update public.projects set publish_state = 'draft' where id = 'global-city-vi';
update public.projects set sort_order = sort_order + 1 where id = 'global-city-v';

reset role;
select is(pg_temp.msgs('units', 'test-draft-live') + pg_temp.msgs('units_reset', 'test-draft-live'), 0::bigint, 'a draft project broadcasts nothing');
select is(pg_temp.msgs('units_reset', 'global-city-vi'), 1::bigint, 'a plot added to a published project asks pages to re-read');
select is(pg_temp.msgs('project', 'global-city-vi'), 1::bigint, 'unpublishing a project is broadcast');
select is(
  (select payload ->> 'published' from realtime.messages
   where topic = 'live-layouts' and event = 'project' and payload ->> 'id' = 'global-city-vi' and inserted_at >= now()::timestamp),
  'false', 'the project message says it is no longer published'
);
select is(pg_temp.msgs('project', 'global-city-v'), 0::bigint, 'editorial changes (sort order) are not broadcast');
select ok(
  (select bool_and(u ->> 'from' = 'available') from realtime.messages m, jsonb_array_elements(m.payload -> 'units') u
   where m.topic = 'live-layouts' and m.event = 'units' and m.inserted_at >= now()::timestamp and u ->> 'number' = '1'),
  'the message carries the status before the change'
);
update public.units set area = area + 1 where project_id = 'global-city-v' and number = '1';
select is(pg_temp.msgs('units_reset', 'global-city-v'), 1::bigint, 'a plot detail edit asks pages to re-read');
select is(pg_temp.msgs('units', 'global-city-v'), 0::bigint, 'and is not announced as a status change');

/* ---------- anon still reads only what is public, and may only listen ---------- */

set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
select is((select count(*)::int from public.units where project_id = 'global-city-vi'), 0, 'anon: an unpublished project''s plots disappear');
select set_config('realtime.topic', 'live-layouts', true);
select ok(
  (select count(*) from realtime.messages where topic = 'live-layouts' and inserted_at >= now()::timestamp) > 0,
  'anon may receive the live-layouts broadcasts'
);
select throws_ok(
  $$ insert into realtime.messages (topic, extension, event, payload, private) values ('live-layouts', 'broadcast', 'units', '{}', true) $$,
  '42501', null, 'anon may not send on the channel'
);

select * from finish();
rollback;
