#!/usr/bin/env bash
# Writes /opt/supabase/.env with fresh secrets (run once, as root; refuses to overwrite). The anon key is public by
# design (the apps ship it); everything else stays in this root-only file. SMTP_PASS is the admin@ mailbox password:
# its owner types it in afterwards (nano /opt/supabase/.env), then `docker compose up -d functions auth`.
set -euo pipefail
cd /opt/supabase
[ ! -e .env ] || { echo ".env exists; not overwriting"; exit 1; }

JWT_SECRET=$(openssl rand -hex 32)
keys=$(JWT_SECRET="$JWT_SECRET" node -e '
  const c = require("crypto"), s = process.env.JWT_SECRET;
  const b = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const sign = (p) => { const d = b({ alg: "HS256", typ: "JWT" }) + "." + b(p); return d + "." + c.createHmac("sha256", s).update(d).digest("base64url"); };
  const iat = Math.floor(Date.now() / 1000), exp = iat + 10 * 365 * 86400;
  console.log("ANON_KEY=" + sign({ role: "anon", iss: "supabase", iat, exp }));
  console.log("SERVICE_ROLE_KEY=" + sign({ role: "service_role", iss: "supabase", iat, exp }));')

umask 077
cat > .env <<EOF
API_EXTERNAL_URL=https://api.greaterinfraprojects.in
POSTGRES_PASSWORD=$(openssl rand -hex 24)
JWT_SECRET=$JWT_SECRET
$keys
SECRET_KEY_BASE=$(openssl rand -hex 32)
REALTIME_DB_ENC_KEY=$(openssl rand -hex 8)
SMTP_USER=admin@greaterinfraprojects.in
SMTP_PASS=
ENQUIRY_MAIL_TO=admin@greaterinfraprojects.in
EOF
echo "wrote /opt/supabase/.env"
