#!/usr/bin/env bash
# Deploys the website and the admin on the KVM server (installed as /usr/local/bin/gip-deploy, run as root).
# Builds GitHub main into its own release folder as the gip user, then points both services at it, so a running site is
# never half-built and a failed build changes nothing. Keeps the newest three releases.
# Settings the build reads: /home/gip/site/env.production (public values only: Supabase URL, publishable key, the
# live layouts address).
set -euo pipefail

REPO=https://github.com/Gjagadish123/gip-platform.git
BASE=/home/gip/site
sha=$(git ls-remote "$REPO" refs/heads/main | cut -c1-7)
rel="$BASE/releases/$sha"

sudo -u gip -H bash -euo pipefail -c "
  mkdir -p '$BASE/releases'
  [ -d '$rel/.git' ] || git clone --quiet --depth 1 '$REPO' '$rel'
  for app in website admin; do
    cd '$rel/'\$app
    cp '$BASE/env.production' .env.production.local
    npm ci --no-audit --no-fund --loglevel=error
    NEXT_TELEMETRY_DISABLED=1 npm run build
  done
"

ln -sfn "$rel" "$BASE/current"
systemctl restart gip-website gip-admin
ls -1dt "$BASE"/releases/* | tail -n +4 | xargs -r rm -rf
echo "deployed $sha"
