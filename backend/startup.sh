#!/bin/sh
set -eu

# Preserve DB_* deployment configuration; DATABASE_URL can supply escaped credentials.
if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="postgres://${DB_USER:?}:${DB_PASS:?}@${DB_HOST:?}:${DB_PORT:-5432}/${DB_NAME:?}"
fi

# Apply database schema changes explicitly as a reviewed release step.
exec node ./build/index.js
