#!/bin/sh
set -eu
trap 'exit 0' INT TERM

if [ -n "${DATABASE_URL:-}" ]; then
  set -- "$DATABASE_URL"
else
  set -- -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
fi

while :; do
  if psql -v ON_ERROR_STOP=1 "$@" -f /cleanup/delete-data.sql; then
    if [ "${CLEANUP_ONCE:-}" = 1 ]; then
      exit 0
    fi
    delay=86400
  else
    if [ "${CLEANUP_ONCE:-}" = 1 ]; then
      exit 1
    fi
    echo "BookIT privacy cleanup failed; retrying in one hour" >&2
    delay=3600
  fi
  sleep "$delay" &
  wait "$!"
done
