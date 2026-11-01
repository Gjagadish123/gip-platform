-- CRM: one common sheet of every lead and booking, and associate/salesperson-wise booking reports.
--
-- enquiries  Leads from the website and the live layouts (enquiry and site-visit forms, plot enquiries). The public
--            can only add one, through public.submit_enquiry() (validated, deduplicated, rate limited); only admins
--            read or remove them.
-- bookings   Sales the admin records: Direct (a GIP salesperson) or through an Associate (an outside agent), with
--            the customer, the plot (its area as booked) and the final sold price. public.save_booking() writes one
--            and puts an Available or Hold plot to Sold Out through set_unit_statuses, so history, activity, the
--            inventory stamp and the live layouts follow as for any sale.
-- crm_sheet  Both in one list, each row labelled with its source, for the admin's Common sheet and its download.
--            security_invoker: the tables' admin-only policies decide who sees rows.

/* ---------- enquiries ---------- */

create table public.enquiries (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  source text not null check (source in ('website', 'live_layout')),
  form text not null check (form in ('enquiry', 'site_visit', 'plot')),
  page text check (char_length(page) <= 200),          -- where it was sent from (a path, for context)
  project_id text references public.projects (id) on delete set null,
  interest text check (char_length(interest) <= 80),   -- what the visitor picked when it isn't a project
  plot_number text check (char_length(plot_number) <= 20),
  wants_similar boolean not null default false,        -- asked for plots like this one (it isn't available)
  name text not null check (char_length(name) between 2 and 60),
  phone text not null check (phone ~ '^\+\d{7,15}$'),  -- E.164 without spaces
  email text check (email is null or (char_length(email) <= 120 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
  message text check (char_length(message) <= 1000),
  visit_when text check (char_length(visit_when) <= 40),
  client_hash text                                     -- md5 of the sender's IP: rate limiting only
);

create index enquiries_created on public.enquiries (created_at desc);
create index enquiries_phone on public.enquiries (phone, created_at desc);
create index enquiries_client on public.enquiries (client_hash, created_at desc) where client_hash is not null;

-- The one way in for the public. p: {source, form, page, project_id, interest, plot_number, similar, name, phone,
-- email, message, visit_when}. Returns the enquiry id. The same lead sent again within 10 minutes (double click,
-- WhatsApp re-open, a corrected message or visit time) updates the first row instead of adding a second. Limits: 5 per
-- phone and 20 per sender IP an hour, 300 a quarter-hour overall; over a limit PostgREST answers 429 (errcode PT429).
-- Bad input answers 400 (22023).
create function public.submit_enquiry(p jsonb) returns bigint
language plpgsql security definer set search_path = ''
as $$
declare
  v_name text := btrim(regexp_replace(coalesce(p ->> 'name', ''), '\s+', ' ', 'g'));
  v_phone text := regexp_replace(coalesce(p ->> 'phone', ''), '[^0-9+]', '', 'g');
  v_email text := nullif(lower(btrim(coalesce(p ->> 'email', ''))), '');
  v_form text := coalesce(p ->> 'form', 'enquiry');
  v_plot text := nullif(btrim(coalesce(p ->> 'plot_number', '')), '');
  v_project text;
  v_headers json := nullif(current_setting('request.headers', true), '')::json;
  -- The IP the platform's proxy saw (Cloudflare's header, else the last X-Forwarded-For hop it appended). Never the
  -- first X-Forwarded-For entry: the sender writes that one.
  v_ip text := btrim(coalesce(v_headers ->> 'cf-connecting-ip', v_headers ->> 'x-real-ip',
    regexp_replace(coalesce(v_headers ->> 'x-forwarded-for', ''), '^.*,', '')));
  v_client text;
  v_id bigint;
begin
  if jsonb_typeof(p) is distinct from 'object' then
    raise exception 'Send the enquiry as an object' using errcode = '22023';
  end if;
  if char_length(v_name) not between 2 and 60 then
    raise exception 'Please enter your name (2 to 60 characters)' using errcode = '22023';
  end if;
  if v_phone !~ '^\+\d{7,15}$' then
    raise exception 'Please enter your phone number with its country code' using errcode = '22023';
  end if;
  if (p ->> 'source') is null or (p ->> 'source') not in ('website', 'live_layout') or v_form not in ('enquiry', 'site_visit', 'plot') then
    raise exception 'Unknown enquiry source or form' using errcode = '22023';
  end if;
  if v_email is not null and (char_length(v_email) > 120 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
    raise exception 'That email address does not look right' using errcode = '22023';
  end if;
  -- Only a project that exists is linked; anything else is kept as the visitor's stated interest.
  select id into v_project from public.projects where id = p ->> 'project_id';
  v_client := case when v_ip <> '' then md5(v_ip) end;

  select e.id into v_id from public.enquiries e
  where e.phone = v_phone and e.form = v_form and e.created_at > now() - interval '10 minutes'
    and e.project_id is not distinct from v_project and e.plot_number is not distinct from v_plot
  order by e.created_at desc limit 1;
  if v_id is not null then
    update public.enquiries set
      name = v_name, email = coalesce(v_email, email),
      message = coalesce(left(nullif(btrim(p ->> 'message'), ''), 1000), message),
      visit_when = coalesce(left(nullif(btrim(p ->> 'visit_when'), ''), 40), visit_when),
      wants_similar = coalesce((p ->> 'similar')::boolean, wants_similar)
    where id = v_id;
    return v_id;
  end if;
  if (select count(*) from public.enquiries where phone = v_phone and created_at > now() - interval '1 hour') >= 5
    or (v_client is not null and (select count(*) from public.enquiries where client_hash = v_client and created_at > now() - interval '1 hour') >= 20)
    or (select count(*) from public.enquiries where created_at > now() - interval '15 minutes') >= 300
  then
    raise exception 'Too many enquiries just now. Please message us on WhatsApp instead.' using errcode = 'PT429';
  end if;

  insert into public.enquiries (source, form, page, project_id, interest, plot_number, wants_similar, name, phone, email, message, visit_when, client_hash)
  values (
    p ->> 'source', v_form, left(nullif(btrim(p ->> 'page'), ''), 200), v_project,
    case when v_project is null then left(nullif(btrim(p ->> 'interest'), ''), 80) end,
    left(v_plot, 20), coalesce((p ->> 'similar')::boolean, false), v_name, v_phone, v_email,
    left(nullif(btrim(p ->> 'message'), ''), 1000), left(nullif(btrim(p ->> 'visit_when'), ''), 40), v_client
  )
  returning id into v_id;
  return v_id;
end $$;

/* ---------- bookings ---------- */

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects (id) on delete restrict, -- a project with sales can't vanish
  unit_id uuid references public.units (id) on delete set null,
  plot_number text not null check (char_length(btrim(plot_number)) between 1 and 20),
  area numeric not null check (area > 0),              -- the plot's area when booked (sq yd for plots)
  customer_name text not null check (char_length(btrim(customer_name)) between 2 and 80),
  customer_phone text not null check (customer_phone ~ '^\+\d{7,15}$'),
  channel text not null check (channel in ('direct', 'associate')),
  agent_name text not null check (char_length(btrim(agent_name)) between 2 and 80), -- salesperson or associate
  price bigint not null check (price > 0),             -- final sold price, ₹
  booked_on date not null default private.today_ist(),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(),                  -- no FK: the record keeps the id after a user is deleted
  created_by_name text not null default private.actor_name(),
  unique (project_id, plot_number)                     -- one booking per plot; a cancelled one is deleted first
);

create index bookings_booked_on on public.bookings (booked_on desc);
create unique index bookings_unit on public.bookings (unit_id) where unit_id is not null; -- also after a renumber
create trigger bookings_updated_at before update on public.bookings
  for each row execute function private.set_updated_at();

-- Add (no id) or edit (id + updated_at as the admin saw it) one booking. p: {id, updated_at, project_id,
-- plot_number, customer_name, customer_phone, channel, agent_name, price, booked_on, note}. The area is the plot's.
-- p_mark_sold: an Available or Hold plot goes to Sold Out with the booking (any other status is left as it is).
-- Fails 40001 when another admin changed the booking or the plot meanwhile, 23505 when the plot is already booked.
create function public.save_booking(p jsonb, p_mark_sold boolean default true) returns uuid
language plpgsql set search_path = ''
as $$
declare
  u public.units;
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_phone text := regexp_replace(coalesce(p ->> 'customer_phone', ''), '[^0-9+]', '', 'g');
  v_channel text := p ->> 'channel';
  v_agent text := btrim(regexp_replace(coalesce(p ->> 'agent_name', ''), '\s+', ' ', 'g'));
  v_customer text := btrim(regexp_replace(coalesce(p ->> 'customer_name', ''), '\s+', ' ', 'g'));
begin
  if not (select private.is_admin()) then
    raise exception 'Only admins can record bookings' using errcode = '42501';
  end if;
  -- An edit follows the booked unit (it may have been renumbered since); a new booking finds the plot by number.
  select u2.* into u from public.bookings b join public.units u2 on u2.id = b.unit_id where b.id = v_id;
  if not found then
    select * into u from public.units where project_id = p ->> 'project_id' and number = btrim(p ->> 'plot_number');
  end if;
  if not found then
    raise exception 'Plot % is not in this project', p ->> 'plot_number' using errcode = '23503';
  end if;
  if v_id is null then
    insert into public.bookings (project_id, unit_id, plot_number, area, customer_name, customer_phone, channel, agent_name, price, booked_on, note)
    values (
      u.project_id, u.id, u.number, u.area, v_customer, v_phone, v_channel, v_agent, (p ->> 'price')::bigint,
      coalesce((p ->> 'booked_on')::date, private.today_ist()), nullif(btrim(p ->> 'note'), '')
    )
    returning id into v_id;
  else
    update public.bookings b set
      project_id = u.project_id, unit_id = u.id, plot_number = u.number,
      area = case when b.unit_id = u.id then b.area else u.area end, -- an edit keeps the area booked; a new plot brings its own
      customer_name = v_customer, customer_phone = v_phone, channel = v_channel, agent_name = v_agent,
      price = (p ->> 'price')::bigint, booked_on = coalesce((p ->> 'booked_on')::date, b.booked_on),
      note = nullif(btrim(p ->> 'note'), '')
    where b.id = v_id and b.updated_at = (p ->> 'updated_at')::timestamptz;
    if not found then
      raise exception 'This booking was changed or removed by another admin, so open it again' using errcode = '40001';
    end if;
  end if;
  if p_mark_sold and u.status in ('available', 'hold') then
    perform public.set_unit_statuses(
      u.project_id, array[u.number], 'sold_out', 'booking-' || v_id,
      format('Booked plot %s (%s, %s)', u.number, case v_channel when 'direct' then 'Direct' else 'Associate' end, v_agent),
      format('Booked: %s, %s', case v_channel when 'direct' then 'Direct' else 'Associate' end, v_agent),
      coalesce((p ->> 'booked_on')::date, private.today_ist()),
      p_from => array[u.status]
    );
  end if;
  return v_id;
end $$;

/* ---------- the common sheet ---------- */

create view public.crm_sheet with (security_invoker = true) as
  select
    'booking:' || b.id as id, b.created_at as at, 'booking' as kind,
    case b.channel when 'direct' then 'Booking · Direct' else 'Booking · Associate' end as source,
    b.project_id, p.name as project_name, b.plot_number, b.area,
    b.customer_name as name, b.customer_phone as phone, null::text as email,
    b.agent_name as agent, b.price, b.booked_on, b.note as details
  from public.bookings b
  left join public.projects p on p.id = b.project_id
  union all
  select
    'enquiry:' || e.id, e.created_at, 'enquiry',
    case e.source when 'website' then 'Website' else 'Live layout' end || ' · '
      || case e.form when 'plot' then 'Plot enquiry' when 'site_visit' then 'Site visit' else 'Enquiry form' end,
    e.project_id, coalesce(p.name, e.interest), e.plot_number, u.area,
    e.name, e.phone, e.email,
    null, null, null,
    nullif(concat_ws(' · ',
      case when e.wants_similar then 'Wants plots like this one' end,
      case when e.visit_when is not null then 'Visit: ' || e.visit_when end,
      e.message), '')
  from public.enquiries e
  left join public.projects p on p.id = e.project_id
  left join public.units u on u.project_id = e.project_id and u.number = e.plot_number;

/* ---------- row level security and grants ---------- */

alter table public.enquiries enable row level security;
alter table public.bookings enable row level security;

create policy "Admins read enquiries" on public.enquiries
  for select to authenticated using ((select private.is_admin()));
create policy "Admins remove enquiries" on public.enquiries
  for delete to authenticated using ((select private.is_admin()));
create policy "Admins only" on public.bookings
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

revoke all on public.enquiries, public.bookings, public.crm_sheet from public, anon, authenticated, service_role;
grant select, delete on public.enquiries to authenticated;
grant select, insert, update, delete on public.bookings to authenticated;
grant select on public.crm_sheet to authenticated;
grant select, insert, update, delete on public.enquiries, public.bookings to service_role;
grant select on public.crm_sheet to service_role;

-- Supabase's default privileges give new functions to anon and authenticated: start from nothing here too.
revoke execute on function public.submit_enquiry(jsonb), public.save_booking(jsonb, boolean) from public, anon, authenticated;
grant execute on function public.submit_enquiry(jsonb) to anon, authenticated, service_role;
grant execute on function public.save_booking(jsonb, boolean) to authenticated, service_role;
