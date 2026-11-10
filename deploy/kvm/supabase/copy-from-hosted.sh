#!/usr/bin/env bash
# One-off move from the hosted Supabase project (jjskgxbshmjsfrowlzsj) into this server's Supabase (run as root, with
# admin edits paused). Reads the hosted connection string from /root/.old-db-url (`gip-secret db` asks for the
# database password) and deletes it at the end.
#   1. data of public + private and the admin logins (auth.users, auth.identities), loaded with triggers off
#   2. every Storage file, re-uploaded through this server's Storage API so files and their records match
#   3. stored file links (project content) rewritten to https://api.greaterinfraprojects.in
#   4. row and file counts compared, old against new
# The schema itself comes from supabase/migrations (applied before this runs, and checked equal to the hosted one).
set -euo pipefail
cd /opt/supabase
set -a; . ./.env; set +a
[ -s /root/.old-db-url ] || { echo "missing /root/.old-db-url (run: gip-secret db)"; exit 1; }
URL=$(cat /root/.old-db-url)
PG=(docker run --rm --network host -e PGCONNECT_TIMEOUT=20 supabase/postgres:17.6.1.136)
NEWDB=(docker exec -i supabase-db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -X -q)
OLD=https://jjskgxbshmjsfrowlzsj.supabase.co
NEW=https://api.greaterinfraprojects.in
W=/root/migration; mkdir -p "$W"; chmod 700 "$W"
COUNTS="select 'projects', count(*) from public.projects union all select 'units', count(*) from public.units
  union all select 'unit_status_events', count(*) from public.unit_status_events union all select 'activity', count(*) from public.activity
  union all select 'enquiries', count(*) from public.enquiries union all select 'bookings', count(*) from public.bookings
  union all select 'auth.users', count(*) from auth.users union all select 'auth.identities', count(*) from auth.identities
  union all select 'storage.objects', count(*) from storage.objects order by 1"

echo "1/4 data"
"${PG[@]}" pg_dump "$URL" --data-only --no-owner --no-privileges \
  -t 'public.*' -t 'private.*' -t auth.users -t auth.identities > "$W/data.sql"
grep -c '^COPY ' "$W/data.sql" | sed 's/^/    tables copied: /'
{ echo "set session_replication_role = replica;"
  echo "truncate public.activity, public.unit_status_events, public.bookings, public.enquiries, public.units, public.projects, auth.identities, auth.users cascade;"
  cat "$W/data.sql"; } | "${NEWDB[@]}"

echo "2/4 files"
"${PG[@]}" psql "$URL" -X -tA -F $'\t' -c "select bucket_id, name, coalesce(metadata->>'mimetype', 'application/octet-stream'),
  coalesce(metadata->>'cacheControl', 'max-age=3600') from storage.objects order by bucket_id, name" > "$W/objects.tsv"
OLD="$OLD" KEY="$SERVICE_ROLE_KEY" W="$W" python3 - <<'PY'
import os, urllib.parse, urllib.request
old, key, w = os.environ["OLD"], os.environ["KEY"], os.environ["W"]
q = lambda s: urllib.parse.quote(s, safe="")
done = 0
for line in open(f"{w}/objects.tsv", encoding="utf-8"):
    bucket, name, mime, cache = line.rstrip("\n").split("\t")
    path = q(bucket) + "/" + "/".join(q(part) for part in name.split("/"))
    data = urllib.request.urlopen(f"{old}/storage/v1/object/public/{path}", timeout=120).read()
    cache = cache if cache.startswith("max-age") or cache.startswith("no-") else f"max-age={cache}"
    req = urllib.request.Request(f"http://127.0.0.1:5000/object/{path}", data=data, method="POST", headers={
        "Authorization": f"Bearer {key}", "Content-Type": mime, "Cache-Control": cache, "x-upsert": "true"})
    urllib.request.urlopen(req, timeout=120).read()
    done += 1
print(f"    files copied: {done}")
PY

echo "3/4 links"
"${NEWDB[@]}" <<SQL
set session_replication_role = replica;
update public.projects set content = replace(content::text, '$OLD/storage/v1/', '$NEW/storage/v1/')::jsonb
where content::text like '%$OLD/storage/v1/%';
SQL
echo "    links left to the hosted project: $(docker exec supabase-db psql -U supabase_admin -d postgres -tA -X -c "select count(*) from public.projects where content::text like '%$OLD%'")"

echo "4/4 counts (table | hosted | here)"
join -t '|' <("${PG[@]}" psql "$URL" -X -tA -c "$COUNTS" | sort) \
  <(docker exec supabase-db psql -U supabase_admin -d postgres -X -tA -c "$COUNTS" | sort) | sed 's/^/    /'

rm -f /root/.old-db-url
echo "done; /root/.old-db-url removed"
