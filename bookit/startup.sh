#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="postgres://${DB_USER:?}:${DB_PASS:?}@${DB_HOST:?}:${DB_PORT:-5432}/${DB_NAME:?}"
fi

exec node ./build/index.js
