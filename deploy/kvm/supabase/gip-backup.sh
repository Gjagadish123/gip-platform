#!/usr/bin/env bash
# Nightly backup of the self-hosted Supabase (installed as /usr/local/bin/gip-backup, run at 02:30 by /etc/cron.d/gip-backup):
# the whole database (pg_dump custom format), the Storage files and the secrets file, kept 14 days in /var/backups/gip.
# Restore: pg_restore -d postgres --clean --if-exists (as supabase_admin), untar storage into /opt/supabase/volumes.
set -euo pipefail
D=/var/backups/gip; t=$(date +%F)
mkdir -p "$D"; chmod 700 "$D"
docker exec supabase-db pg_dump -U supabase_admin -d postgres -Fc > "$D/db-$t.dump"
tar -C /opt/supabase/volumes -czf "$D/storage-$t.tar.gz" storage
install -m 600 /opt/supabase/.env "$D/env-$t"
find "$D" -type f -mtime +14 -delete
echo "$(date -Is) backup ok: $(du -sh "$D" | cut -f1) in $D"
