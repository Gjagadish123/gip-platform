#!/usr/bin/env bash
# Checks that every public page of the website answers 200 (installed as /usr/local/bin/gip-check, run as root).
# The pages: Home, Projects, About, Contact and every page in the sitemap (each published project).
#
#   gip-check               check the pages as they are cached now
#   gip-check --revalidate  first expire the cached project data, exactly as an admin save does, then check twice:
#                           pages must survive the re-render (on 15 Nov 2026 they did not: every project page gave 500
#                           after the first admin edit). gip-deploy runs this and rolls back when it fails.
#   gip-check --watch       for cron: check; on a failure restart the website once, check again, and log both to
#                           /var/log/gip-check.log.
#
# Talks to the website directly on 127.0.0.1:3000, so it tests the Next.js server itself, not Caddy or DNS.
set -uo pipefail

SITE=http://127.0.0.1:3000
ENV=/home/gip/site/env.production
LOG=/var/log/gip-check.log

pages() {
  printf '%s\n' / /projects /about /contact
  curl -s --max-time 20 "$SITE/sitemap.xml" | grep -o '<loc>[^<]*</loc>' | sed -E 's#<loc>https?://[^/]+##; s#</loc>##; s#^$#/#'
}

check() {
  local bad=0 code
  for p in $(pages | sort -u); do
    code=$(curl -s -o /dev/null --max-time 30 -w '%{http_code}' "$SITE$p")
    if [ "$code" != 200 ]; then
      echo "FAIL $code $p"
      bad=1
    fi
  done
  return $bad
}

wait_ready() {
  for _ in $(seq 1 60); do
    curl -s -o /dev/null --max-time 5 "$SITE/" && return 0
    sleep 1
  done
  return 1
}

case "${1:-}" in
  --revalidate)
    wait_ready || { echo "FAIL website did not start"; exit 1; }
    check || exit 1
    secret=$(grep '^REVALIDATE_SECRET=' "$ENV" | cut -d= -f2-)
    code=$(curl -s -o /dev/null --max-time 20 -w '%{http_code}' -X POST -H "x-revalidate-secret: $secret" "$SITE/api/revalidate")
    [ "$code" = 204 ] || [ "$code" = 200 ] || { echo "FAIL revalidate answered $code"; exit 1; }
    sleep 2
    check && check || exit 1
    echo "ok: every page answers 200, also after a data refresh"
    ;;
  --watch)
    out=$(check) && exit 0
    { date -Is; echo "$out"; } >>"$LOG"
    systemctl restart gip-website
    wait_ready
    if out=$(check); then
      echo "$(date -Is) recovered after a restart" >>"$LOG"
    else
      { date -Is; echo "STILL FAILING after a restart"; echo "$out"; } >>"$LOG"
      exit 1
    fi
    ;;
  *)
    check && echo "ok: every page answers 200"
    ;;
esac
