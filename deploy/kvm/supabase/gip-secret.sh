#!/usr/bin/env bash
# Asks for a secret without showing it and stores it on this server (installed as /usr/local/bin/gip-secret).
#   gip-secret smtp     the admin@greaterinfraprojects.in mailbox password → /opt/supabase/.env (SMTP_PASS),
#                       then restarts the email function and Auth so they use it
#   gip-secret db       (or old-db) the hosted Supabase database password → /root/.old-db-url as a direct connection string
#                       (IPv6, for the one-off copy)
set -euo pipefail
# Letters only, so a copied look-alike dash ("old‑db") still works.
what=$(printf '%s' "${1:-}" | tr -cd 'a-z')
case "$what" in
  smtp) prompt="Password of admin@greaterinfraprojects.in: " ;;
  db|olddb) what=db; prompt="Hosted Supabase database password: " ;;
  *) echo "usage: gip-secret smtp | gip-secret db"; exit 1 ;;
esac
read -rsp "$prompt" value; echo
[ -n "$value" ] || { echo "Nothing entered; nothing changed."; exit 1; }
if [ "$what" = db ]; then
  umask 077
  VALUE="$value" python3 -c 'import os, urllib.parse; print("postgresql://postgres:" + urllib.parse.quote(os.environ["VALUE"], safe="") + "@db.jjskgxbshmjsfrowlzsj.supabase.co:5432/postgres?sslmode=require", end="")' > /root/.old-db-url
  docker run --rm --network host -e PGCONNECT_TIMEOUT=15 supabase/postgres:17.6.1.136 psql "$(cat /root/.old-db-url)" -X -tAc "select 'Connected to the hosted database.'" 2>/dev/null     || { rm -f /root/.old-db-url; echo "That password didn't work; nothing saved."; exit 1; }
  echo "Saved."
  exit 0
fi
VALUE="$value" python3 - <<'PY'
import os, re
v = os.environ["VALUE"]
# Docker Compose reads .env: single quotes keep the value literal; a password with a quote goes in double quotes.
line = "SMTP_PASS='" + v + "'" if "'" not in v else 'SMTP_PASS="' + v.replace("\\", "\\\\").replace('"', '\\"').replace("$", "$$") + '"'
p = "/opt/supabase/.env"
s = open(p).read()
s = re.sub(r"(?m)^SMTP_PASS=.*$", lambda m: line, s)
open(p, "w").write(s)
PY
(cd /opt/supabase && docker compose up -d functions auth >/dev/null 2>&1)
echo "Saved. The enquiry email now uses it."
