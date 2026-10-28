-- Admin backend: access rules, the Hold status, unit RPCs, history, undo and stale-write protection. Runs on the
-- seeded local database (Global City VI, 288 plots: 1, 2, 5, 9 Available, 3 Registered, 37 Sold Out, 229 Mortgaged)
-- inside a transaction that is rolled back: `npm run db:test` from the repo root. Creates its own users.
begin;
create extension if not exists pgtap with schema extensions;
select plan(55);

insert into auth.users (id, email, raw_app_meta_data) values
  ('a0000000-0000-4000-8000-00000000000a', 'test-admin@gip.local', '{"role": "admin"}'),
  ('a0000000-0000-4000-8000-00000000000b', 'someone@example.com', '{}');

create function pg_temp.unit(n text) returns public.units language sql as $$
  select * from public.units where project_id = 'global-city-vi' and number = n;
$$;
create function pg_temp.events(n text) returns bigint language sql as $$
  select count(*) from public.unit_status_events e join public.units u on u.id = e.unit_id
  where u.project_id = 'global-city-vi' and u.number = n;
$$;
-- A unit as the admin sends it to save_unit: its row plus what it was before this edit.
create function pg_temp.edit(n text, patch jsonb) returns jsonb language sql as $$
  select to_jsonb(u) || jsonb_build_object('number_was', u.number, 'status_was', u.status) || patch
  from public.units u where project_id = 'global-city-vi' and number = n;
$$;
-- A unit as the admin keeps it to restore later: its row plus its history as StatusEvents.
create function pg_temp.with_history(n text) returns jsonb language sql as $$
  select to_jsonb(u) || jsonb_build_object('history', (
    select jsonb_agg(jsonb_build_object('from', e.from_status, 'to', e.to_status, 'at', e.at, 'by', e.actor_name,
                                        'note', e.note, 'batchId', e.batch_id, 'prev', e.prev) order by e.at, e.id)
    from public.unit_status_events e where e.unit_id = u.id))
  from public.units u where project_id = 'global-city-vi' and number = n;
$$;

select ok('hold' = any (enum_range(null::public.unit_status)::text[]), 'unit_status has Hold');
select is((select count(*)::int from public.units where project_id = 'global-city-vi'), 288, 'seed: 288 Global City VI plots');

/* ---------- admin: Hold through the bulk RPC ---------- */

-- Roles and claims as PostgREST sets them.
set local role authenticated;
set local request.jwt.claims to '{"role": "authenticated", "sub": "a0000000-0000-4000-8000-00000000000a", "email": "test-admin@gip.local", "app_metadata": {"role": "admin"}, "user_metadata": {"name": "Admin"}}';
insert into public.projects (id, slug, name, type_id) values ('test-draft', 'test-draft', 'Test Draft', 'open-plots');

select is(
  public.set_unit_statuses('global-city-vi', array['1', '2', '37'], 'hold', 'b-hold', 'Marked 3 plots Hold', 'Token paid',
    p_from => array['available', 'available', 'sold_out']::public.unit_status[]),
  3, 'bulk change to Hold: 3 plots'
);
select is((pg_temp.unit('1')).status, 'hold', 'plot 1 is on Hold');
select is((pg_temp.unit('1')).status_note, 'Token paid', 'note stored on the unit');
select is((select count(*)::int from public.unit_status_events where batch_id = 'b-hold'), 3, 'trigger logged one event per plot with the batch id');
select is(
  (select prev ->> 'status' from public.unit_status_events e join public.units u on u.id = e.unit_id
   where e.batch_id = 'b-hold' and u.number = '37'), 'sold_out',
  'event keeps the previous status for undo'
);
select is((select actor_name from public.unit_status_events where batch_id = 'b-hold' limit 1), 'Admin', 'event actor comes from the JWT');
select is((select unit_numbers from public.activity where batch_id = 'b-hold'), array['1', '2', '37'], 'one activity row with the changed plots');
select is(
  (select inventory_updated_at from public.projects where id = 'global-city-vi'), (now() at time zone 'Asia/Kolkata')::date,
  'inventory stamped today (IST)'
);
select is(
  public.set_unit_statuses('global-city-vi', array['1'], 'hold', 'b-noop', 'Marked plot 1 Hold', p_from => array['hold']::public.unit_status[]),
  0, 'already on Hold: nothing changes'
);
select is((select count(*)::int from public.activity where batch_id = 'b-noop'), 0, 'a no-op writes no activity');
select throws_ok(
  $$ select public.set_unit_statuses('global-city-vi', array['5'], 'sold_out', 'b-stale', 'x', p_from => array['hold']::public.unit_status[]) $$,
  '40001', null, 'stale screen (plot 5 is not on Hold): the bulk change is refused'
);

/* ---------- undo a status batch ---------- */

select public.set_unit_statuses('global-city-vi', array['2'], 'sold_out', 'b-later', 'Marked plot 2 Sold Out', p_from => array['hold']::public.unit_status[]);
select public.undo_batch('b-hold', 'global-city-vi');
select is((pg_temp.unit('1')).status, 'available', 'undo: plot 1 back to Available');
select is((pg_temp.unit('1')).status_note, null, 'undo: note restored');
select is((pg_temp.unit('37')).status, 'sold_out', 'undo: plot 37 back to Sold Out');
select is((pg_temp.unit('2')).status, 'sold_out', 'undo: plot 2 changed later, so it keeps the later change');
select is((select count(*)::int from public.unit_status_events where batch_id = 'b-hold'), 1, 'undo: reverted events gone, the kept one stays');
select is((select count(*)::int from public.activity where batch_id = 'b-hold'), 0, 'undo: activity gone');

/* ---------- save_unit: edit, rename, stale edits, adds ---------- */

select public.save_unit('global-city-vi', pg_temp.edit('5', '{"number": "5A", "status": "hold", "status_note": "Held for buyer"}'), 'Marked plot 5A Hold');
select is((pg_temp.unit('5A')).status, 'hold', 'save_unit: renamed 5 → 5A and put it on Hold');
select is(pg_temp.events('5A'), 2::bigint, 'save_unit: history kept through the rename, plus the Hold event');
select throws_ok(
  $$ select public.save_unit('global-city-vi', pg_temp.edit('9', '{"status_was": "sold_out", "facing": "East"}')) $$,
  '40001', null, 'save_unit: an edit made on a stale status is refused'
);
select throws_ok(
  $$ select public.save_unit('global-city-vi', '{"number": "9", "area": 100, "status": "available"}') $$,
  '23505', null, 'save_unit: adding a number that exists fails instead of overwriting it'
);
select public.save_unit('global-city-vi', '{"number": "289", "area": 150, "status": "hold", "status_note": "New plot"}', 'Marked plot 289 Hold');
select is(
  (select actor_id from public.unit_status_events e join public.units u on u.id = e.unit_id where u.project_id = 'global-city-vi' and u.number = '289'),
  'a0000000-0000-4000-8000-00000000000a'::uuid, 'save_unit: a new unit''s creation event records who made it'
);
select throws_ok(
  $$ update public.units set mortgaged_to = 'HMDA' where project_id = 'global-city-vi' and number = '1' $$,
  '23514', null, 'mortgagee only on Mortgaged units'
);
select throws_ok($$ update public.units set status = 'reserved' where number = '1' $$, '22P02', null, 'unknown statuses are rejected');
update public.units set bhk = 2.5 where project_id = 'global-city-vi' and number = '9';
select is((pg_temp.unit('9')).bhk, 2.5::numeric, 'BHK takes half steps');

/* ---------- replace_units is a change, not a snapshot ---------- */

select set_config('test.plot3', pg_temp.with_history('3')::text, true);
select public.replace_units('global-city-vi', '[]', array['3', '229'], 'b-remove', 'Removed 2 plots: 3, 229');
select is((select count(*)::int from public.units where project_id = 'global-city-vi'), 287, 'replace: 2 plots removed (288 + 289 − 2)');
select is((pg_temp.unit('2')).status, 'sold_out', 'replace: plots it did not name are untouched');
select throws_ok(
  $$ select public.replace_units('global-city-vi', '[]', array['2'], 'b-stale-rm', 'x', array['available']::public.unit_status[]) $$,
  '40001', null, 'replace: removing a plot another admin sold meanwhile is refused'
);
select throws_ok(
  $$ select public.replace_units('global-city-vi', '[{"number": "9", "area": 100}]', '{}', 'b-dup', 'x') $$,
  '23505', null, 'replace: adding a number that exists fails'
);
select public.undo_batch('b-remove', 'global-city-vi', p_add => jsonb_build_array(current_setting('test.plot3')::jsonb));
select is((select count(*)::int from public.units where project_id = 'global-city-vi'), 288, 'undo replace: plot 3 back (229 was not restored)');
select is((pg_temp.unit('3')).status, 'registered', 'undo replace: plot 3 back as Registered');
select is(pg_temp.events('3'), 3::bigint, 'undo replace: plot 3 history restored, not re-logged');
select is((select count(*)::int from public.activity where batch_id = 'b-remove'), 0, 'undo replace: activity gone');

-- Undo of a status change still works after its unit was removed and restored, status fields and all.
select set_config('test.plot3_date', (pg_temp.unit('3')).status_date::text, true);
select public.set_unit_statuses('global-city-vi', array['3'], 'hold', 'b-x', 'Marked plot 3 Hold', 'Registration entered by mistake', p_from => array['registered']::public.unit_status[]);
select set_config('test.plot3', pg_temp.with_history('3')::text, true);
select public.replace_units('global-city-vi', '[]', array['3'], 'b-y', 'Removed plot 3');
select public.undo_batch('b-y', 'global-city-vi', p_add => jsonb_build_array(current_setting('test.plot3')::jsonb));
select public.undo_batch('b-x', 'global-city-vi');
select is((pg_temp.unit('3')).status, 'registered', 'undo after remove + restore: plot 3 back to Registered');
select is((pg_temp.unit('3')).status_date::text, current_setting('test.plot3_date'), 'undo after remove + restore: its date comes back too');

/* ---------- signed-in user who is not an admin ---------- */

set local request.jwt.claims to '{"role": "authenticated", "sub": "a0000000-0000-4000-8000-00000000000b", "email": "someone@example.com"}';
select is((select count(*)::int from public.projects), 0, 'non-admin: sees no projects');
select is((select count(*)::int from public.units), 0, 'non-admin: sees no units (no notes, mortgagees or deed numbers)');
select is(public.set_unit_statuses('global-city-vi', array['1'], 'hold', 'b-user', 'x'), 0, 'non-admin: status RPC changes nothing');
select throws_ok(
  $$ insert into public.projects (id, slug, name, type_id) values ('x', 'x', 'X', 'open-plots') $$,
  '42501', null, 'non-admin: cannot add projects'
);
select is((select count(*)::int from public.activity), 0, 'non-admin: no activity');

/* ---------- admin role removed: the still-valid JWT stops working at once ---------- */

reset role;
update auth.users set raw_app_meta_data = '{}' where id = 'a0000000-0000-4000-8000-00000000000a';
set local role authenticated;
set local request.jwt.claims to '{"role": "authenticated", "sub": "a0000000-0000-4000-8000-00000000000a", "email": "test-admin@gip.local", "app_metadata": {"role": "admin"}}';
select is((select count(*)::int from public.projects), 0, 'role removed: an admin JWT that is still valid reads nothing');
select throws_ok(
  $$ insert into public.projects (id, slug, name, type_id) values ('y', 'y', 'Y', 'open-plots') $$,
  '42501', null, 'role removed: and writes nothing'
);

/* ---------- website (anon) ---------- */

set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
select is((select count(*)::int from public.projects where publish_state <> 'published'), 0, 'anon: published projects only');
select is((select count(*)::int from public.projects where id = 'test-draft'), 0, 'anon: drafts hidden');
select is(
  (select count(*)::int from public.units where project_id = 'global-city-vi' and status = 'available'), 209,
  'anon: reads unit statuses of published projects'
);
select throws_ok($$ select content from public.projects limit 1 $$, '42501', null, 'anon: no raw project content');
select ok((select public_content ? 'location' from public.projects where id = 'global-city-vi'), 'anon: reads the public copy of content');
select ok(
  (select not (public_content ? 'price') and not (public_content ? 'priceLabel') from public.projects where id = 'global-city-vi'),
  'anon: a hidden price is not in the public copy'
);
select throws_ok($$ select price from public.units limit 1 $$, '42501', null, 'anon: no unit prices');
select throws_ok($$ select document_no from public.units limit 1 $$, '42501', null, 'anon: no sale deed numbers');
select throws_ok($$ select status_note from public.units limit 1 $$, '42501', null, 'anon: no status notes');
select throws_ok($$ select * from public.unit_status_events limit 1 $$, '42501', null, 'anon: no history');
select throws_ok(
  $$ select public.set_unit_statuses('global-city-vi', array['1'], 'hold', 'b', 'x') $$,
  '42501', null, 'anon: cannot call the RPCs'
);

select * from finish();
rollback;
