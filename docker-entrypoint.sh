#!/bin/sh
set -eu

# Only server startup deploys migrations; one-off CLI commands still work.
if [ "${1:-}" = "node" ] && [ "${2:-}" = "./build/index.js" ] && [ "$#" -eq 2 ]; then
  ./node_modules/.bin/prisma migrate deploy
fi

exec "$@"
