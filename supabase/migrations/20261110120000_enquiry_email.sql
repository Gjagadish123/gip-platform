-- Every new enquiry is emailed to the sales inbox (gip@greaterinfraprojects.in) as well as kept in the Common sheet.
--
-- The insert trigger hands the new row's id to the enquiry-email Edge Function (supabase/functions/enquiry-email)
-- through pg_net. The function claims the row (emailed_at), sends it from a Hostinger mailbox over SMTP, and releases
-- the claim if sending fails. The function's URL is the Vault secret 'enquiry_email_url', set on the hosted project
-- only, so a local database never calls it. Nothing here can stop an enquiry from being stored.

create extension if not exists pg_net with schema extensions;

alter table public.enquiries add column emailed_at timestamptz; -- when the sales inbox was sent this enquiry

create function private.email_enquiry() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_url text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'enquiry_email_url';
  if v_url is not null then
    perform net.http_post(
      url := v_url,
      body := jsonb_build_object('id', new.id),
      headers := jsonb_build_object('Content-Type', 'application/json'),
      timeout_milliseconds := 10000
    );
  end if;
  return new;
exception when others then
  return new; -- an email problem must never lose the enquiry
end $$;

create trigger enquiries_email after insert on public.enquiries
  for each row execute function private.email_enquiry();
