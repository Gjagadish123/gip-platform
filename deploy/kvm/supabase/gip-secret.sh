#!/usr/bin/env bash
# Asks for a secret without showing it and stores it on this server (installed as /usr/local/bin/gip-secret).
#   gip-secret smtp     the admin@greaterinfraprojects.in mailbox password → /opt/supabase/.env (SMTP_PASS),
#                       then restarts the email function and Auth so they use it
#   gip-secret old-db   the hosted Supabase Session pooler connection string → /root/.old-db-url (for the one-off copy)
set -euo pipefail
case "${1:-}" in
  smtp) prompt="Password of admin@greaterinfraprojects.in: " ;;
  old-db) prompt="Hosted Supabase connection string (Session pooler, password filled in): " ;;
  *) echo "usage: gip-secret smtp|old-db"; exit 1 ;;
esac
read -rsp "$prompt" value; echo
[ -n "$value" ] || { echo "Nothing entered; nothing changed."; exit 1; }
if [ "$1" = old-db ]; then
  umask 077; printf '%s' "$value" > /root/.old-db-url
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
