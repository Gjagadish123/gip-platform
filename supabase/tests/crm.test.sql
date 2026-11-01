-- CRM: who can send, read and change enquiries and bookings; submit_enquiry's validation, dedupe and limits;
-- save_booking's Sold Out hand-off; the common sheet. Runs inside a transaction that is rolled back
-- (`npm run db:test`). Picks plots by status, so it works on any seeded data. Creates its own users.
begin;
create extension if not exists pgtap with schema extensions;
select plan(49);

insert into auth.users (id, email, raw_app_meta_data) values
  ('a0000000-0000-4000-8000-00000000003a', 'crm-admin@gip.local', '{"role": "admin"}'),
  ('a0000000-0000-4000-8000-00000000003b', 'crm-someone@example.com', '{}');

-- Two Available plots and one Mortgaged plot of Global City VI, whatever the seed says.
create temp table picks as
  select
    (select number from public.units where project_id = 'global-city-vi' and status = 'available' order by number::int limit 1) as free1,
    (select number from public.units where project_id = 'global-city-vi' and status = 'available' order by number::int offset 1 limit 1) as free2,
    (select number from public.units where project_id = 'global-city-vi' and status = 'mortgaged' order by number::int limit 1) as mortgaged;
grant select on picks to anon, authenticated;
create function pg_temp.pick(k text) returns text language sql as $$
  select case k when 'free1' then free1 when 'free2' then free2 else mortgaged end from picks;
$$;
create function pg_temp.status(n text) returns public.unit_status language sql as $$
  select status from public.units where project_id = 'global-city-vi' and number = n;
$$;
create function pg_temp.lead(phone text, extra jsonb default '{}') returns jsonb language sql as $$
  select jsonb_build_object('source', 'website', 'form', 'enquiry', 'name', 'Ravi Kumar', 'phone', phone,
    'project_id', 'global-city-vi', 'page', '/projects/global-city-vi/') || extra;
$$;

/* ---------- the public: send only ---------- */

set local role anon;
set local request.headers to '{"x-forwarded-for": "198.51.100.66, 203.0.113.7"}'; -- a forged first hop, then the proxy's

select isnt(public.submit_enquiry(pg_temp.lead('+91 98765 43210')), null, 'anyone can send an enquiry');
select is(
  public.submit_enquiry(pg_temp.lead('+919876543210')),
  public.submit_enquiry(pg_temp.lead('+91-98765-43210')),
  'the same lead sent again within 10 minutes is one enquiry'
);
select isnt(
  public.submit_enquiry(pg_temp.lead('+919876543210', '{"form": "plot", "plot_number": "12", "similar": true}')),
  public.submit_enquiry(pg_temp.lead('+919876543210')),
  'a plot enquiry from the same person is its own row'
);
select throws_ok($$ select public.submit_enquiry(pg_temp.lead('9876543210')) $$, '22023', null, 'a phone without its country code is refused');
select throws_ok($$ select public.submit_enquiry(pg_temp.lead('+91 98765 43210', '{"name": "R"}')) $$, '22023', null, 'a one-letter name is refused');
select throws_ok($$ select public.submit_enquiry(pg_temp.lead('+91 98765 43210', '{"source": "admin"}')) $$, '22023', null, 'an unknown source is refused');
select throws_ok($$ select public.submit_enquiry(pg_temp.lead('+91 98765 43210', '{"email": "not-an-email"}')) $$, '22023', null, 'a malformed email is refused');
select throws_ok($$ select public.submit_enquiry('"just text"'::jsonb) $$, '22023', null, 'a non-object is refused');
select throws_ok($$ select * from public.enquiries $$, '42501', null, 'the public cannot read enquiries');
select throws_ok(
  $$ insert into public.enquiries (source, form, name, phone) values ('website', 'enquiry', 'Direct', '+919999999999') $$,
  '42501', null, 'the public cannot write the table directly'
);
select throws_ok($$ select * from public.crm_sheet $$, '42501', null, 'the public cannot read the common sheet');
select throws_ok($$ select * from public.bookings $$, '42501', null, 'the public cannot read bookings');
select throws_ok(
  $$ select public.save_booking('{"project_id": "global-city-vi", "plot_number": "1"}') $$,
  '42501', null, 'the public cannot record bookings'
);

-- Limits: 5 per phone an hour (two rows so far: the enquiry and the plot enquiry).
select lives_ok($$ select public.submit_enquiry(pg_temp.lead('+919876543210', '{"form": "site_visit", "visit_when": "This weekend"}')) $$, 'third row from one phone');
select lives_ok($$ select public.submit_enquiry(pg_temp.lead('+919876543210', '{"project_id": "global-city-v"}')) $$, 'fourth row from one phone');
select lives_ok($$ select public.submit_enquiry(pg_temp.lead('+919876543210', '{"project_id": "western-county"}')) $$, 'fifth row from one phone');
select throws_ok($$ select public.submit_enquiry(pg_temp.lead('+919876543210', '{"project_id": "global-city-rrr"}')) $$, 'PT429', null, 'a sixth within the hour is refused (HTTP 429)');

reset role;
select is((select count(*)::int from public.enquiries where phone = '+919876543210'), 5, 'five rows stored for that phone, spaces and dashes removed');
select is(
  (select count(distinct client_hash)::int from public.enquiries where phone = '+919876543210'), 1,
  'the sender is kept only as a hash of its IP'
);
select is((select client_hash from public.enquiries where phone = '+919876543210' limit 1), md5('203.0.113.7'), 'the IP the proxy saw, not a forged first hop');
select ok((select wants_similar from public.enquiries where phone = '+919876543210' and form = 'plot'), 'a plots-like-this enquiry is flagged');
set local role anon;
select isnt(
  set_config('crm.resend', public.submit_enquiry(pg_temp.lead('+919876543210', '{"form": "site_visit", "visit_when": "On a weekday", "message": "Sunday is fine too"}'))::text, true),
  null, 'a corrected resend is accepted'
);
reset role;
select is(
  current_setting('crm.resend')::bigint, (select id from public.enquiries where phone = '+919876543210' and form = 'site_visit'),
  'a corrected resend within 10 minutes keeps one row'
);
select is(
  (select visit_when || '|' || message from public.enquiries where phone = '+919876543210' and form = 'site_visit'),
  'On a weekday|Sunday is fine too', 'and that row now carries the correction'
);

set local role anon;
select lives_ok(
  $$ select public.submit_enquiry(pg_temp.lead('+447700900123', '{"project_id": "nowhere", "interest": "General enquiry", "email": "A.B@Example.com"}')) $$,
  'an enquiry about no listed project is still taken'
);
reset role;
select is(
  (select coalesce(project_id, 'none') || '|' || interest || '|' || email from public.enquiries where phone = '+447700900123'),
  'none|General enquiry|a.b@example.com', 'an unknown project is kept as the stated interest; the email is lower-cased'
);

/* ---------- a signed-in non-admin: nothing ---------- */

set local role authenticated;
set local request.jwt.claims to '{"role": "authenticated", "sub": "a0000000-0000-4000-8000-00000000003b", "email": "crm-someone@example.com", "app_metadata": {}}';
select is((select count(*)::int from public.enquiries), 0, 'a non-admin sees no enquiries');
select is((select count(*)::int from public.crm_sheet), 0, 'a non-admin sees an empty common sheet');
select throws_ok(
  format($$ select public.save_booking('{"project_id": "global-city-vi", "plot_number": "%s", "customer_name": "X Y", "customer_phone": "+919000000000", "channel": "direct", "agent_name": "Sales", "price": 100}') $$, pg_temp.pick('free1')),
  '42501', null, 'a non-admin cannot record a booking'
);

/* ---------- admin: bookings ---------- */

set local request.jwt.claims to '{"role": "authenticated", "sub": "a0000000-0000-4000-8000-00000000003a", "email": "crm-admin@gip.local", "app_metadata": {"role": "admin"}, "user_metadata": {"name": "Admin"}}';

select isnt(set_config('crm.b1', public.save_booking(jsonb_build_object(
  'project_id', 'global-city-vi', 'plot_number', pg_temp.pick('free1'), 'customer_name', '  Sita   Devi ',
  'customer_phone', '+91 90000 11111', 'channel', 'direct', 'agent_name', 'Kiran', 'price', 2450000, 'booked_on', '2026-11-01'
))::text, true), null, 'an admin books an Available plot, Direct');
select is(pg_temp.status(pg_temp.pick('free1')), 'sold_out', 'a booking puts an Available plot to Sold Out');
select is(
  (select customer_name || '|' || customer_phone || '|' || area::text = 'Sita Devi|+919000011111|' || (select area::text from public.units where project_id = 'global-city-vi' and number = pg_temp.pick('free1'))
   from public.bookings where id = current_setting('crm.b1')::uuid),
  true, 'names tidied, phone normalised, the plot''s area recorded'
);
select is(
  (select count(*)::int from public.activity where batch_id = 'booking-' || current_setting('crm.b1')::uuid), 1,
  'the sale shows in activity like any status change'
);
select is(
  (select note from public.unit_status_events e join public.units u on u.id = e.unit_id
   where u.project_id = 'global-city-vi' and u.number = pg_temp.pick('free1') order by e.at desc, e.id desc limit 1),
  'Booked: Direct, Kiran', 'the history says who sold it'
);
select throws_ok(
  format($$ select public.save_booking('{"project_id": "global-city-vi", "plot_number": "%s", "customer_name": "Other Buyer", "customer_phone": "+919000022222", "channel": "associate", "agent_name": "Agent A", "price": 100}') $$, pg_temp.pick('free1')),
  '23505', null, 'a plot can only be booked once'
);

select isnt(set_config('crm.b2', public.save_booking(jsonb_build_object(
  'project_id', 'global-city-vi', 'plot_number', pg_temp.pick('mortgaged'), 'customer_name', 'Arun Rao',
  'customer_phone', '+919000033333', 'channel', 'associate', 'agent_name', 'Sri Lakshmi Realty', 'price', 3100000
))::text, true), null, 'an admin books a Mortgaged plot through an Associate');
select is(pg_temp.status(pg_temp.pick('mortgaged')), 'mortgaged', 'a Mortgaged plot keeps its status when booked');

select isnt(set_config('crm.b3', public.save_booking(jsonb_build_object(
  'project_id', 'global-city-vi', 'plot_number', pg_temp.pick('free2'), 'customer_name', 'Meena K',
  'customer_phone', '+919000044444', 'channel', 'associate', 'agent_name', 'Sri Lakshmi Realty', 'price', 1990000
), false)::text, true), null, 'an admin books without marking the plot sold');
select is(pg_temp.status(pg_temp.pick('free2')), 'available', 'p_mark_sold false leaves the plot as it is');

select throws_ok(
  $$ select public.save_booking('{"project_id": "global-city-vi", "plot_number": "no-such-plot", "customer_name": "X Y", "customer_phone": "+919000000000", "channel": "direct", "agent_name": "Sales", "price": 100}') $$,
  '23503', null, 'an unknown plot is refused'
);
select throws_ok(
  format($$ select public.save_booking('{"project_id": "global-city-vi", "plot_number": "%s", "customer_name": "X Y", "customer_phone": "12", "channel": "direct", "agent_name": "Sales", "price": 100}', false) $$, pg_temp.pick('free2')),
  '23514', null, 'a bad phone breaks the table check'
);

-- Edit: guarded by updated_at.
select lives_ok(
  format($$ select public.save_booking(jsonb_build_object('id', '%s', 'updated_at', '%s', 'project_id', 'global-city-vi', 'plot_number', '%s',
    'customer_name', 'Sita Devi', 'customer_phone', '+919000011111', 'channel', 'direct', 'agent_name', 'Kiran', 'price', 2500000)) $$,
    current_setting('crm.b1')::uuid, (select updated_at from public.bookings where id = current_setting('crm.b1')::uuid), pg_temp.pick('free1')),
  'an admin edits a booking'
);
select is((select price from public.bookings where id = current_setting('crm.b1')::uuid), 2500000::bigint, 'the final price is updated');
select throws_ok(
  format($$ select public.save_booking(jsonb_build_object('id', '%s', 'updated_at', '2000-01-01T00:00:00Z', 'project_id', 'global-city-vi', 'plot_number', '%s',
    'customer_name', 'Sita Devi', 'customer_phone', '+919000011111', 'channel', 'direct', 'agent_name', 'Kiran', 'price', 1)) $$,
    current_setting('crm.b1')::uuid, pg_temp.pick('free1')),
  '40001', null, 'an edit made on a stale screen is refused'
);

/* ---------- admin: the common sheet ---------- */

select is((select count(*)::int from public.crm_sheet where kind = 'booking'), (select count(*)::int from public.bookings), 'every booking is in the sheet');
select is((select count(*)::int from public.crm_sheet where kind = 'enquiry'), (select count(*)::int from public.enquiries), 'every enquiry is in the sheet');
select is(
  (select source from public.crm_sheet where id = 'booking:' || current_setting('crm.b2')::uuid), 'Booking · Associate',
  'a booking says whether it was Direct or through an Associate'
);
select is(
  (select source || '|' || coalesce(details, '') from public.crm_sheet where kind = 'enquiry' and phone = '+919876543210' and plot_number = '12'),
  'Website · Plot enquiry|Wants plots like this one', 'an enquiry says where it came from and what was asked'
);
select ok(
  (select area is not null and project_name = 'Global City VI' from public.crm_sheet where kind = 'enquiry' and plot_number = '12' limit 1),
  'a plot enquiry carries the project name and the plot''s area'
);

select * from finish();
rollback;
