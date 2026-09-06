#!/bin/sh
set -eu
trap 'exit 0' INT TERM
while :; do
  if psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /cleanup/delete-data.sql; then
    delay=86400
  else
    echo "BookIT privacy cleanup failed; retrying in one hour" >&2
    delay=3600
  fi
  sleep "$delay" &
  wait "$!"
done
