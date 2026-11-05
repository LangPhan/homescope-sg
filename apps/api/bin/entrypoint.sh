#!/bin/sh
set -eu
attempt=0
until php bin/seed.php; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 20 ]; then echo "Database did not become ready" >&2; exit 1; fi
  sleep 3
done
exec "$@"
