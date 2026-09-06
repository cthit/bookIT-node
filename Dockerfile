FROM node:24.19.0-bookworm-slim AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

FROM base AS build
ENV CI=true
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate
WORKDIR /workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY bookit/package.json ./bookit/package.json
COPY frontend/package.json ./frontend/package.json
RUN pnpm install --frozen-lockfile --filter bookit --filter @bookit/frontend
COPY bookit ./bookit
COPY frontend ./frontend
RUN pnpm --dir bookit exec prisma generate \
    && pnpm --dir bookit build \
    && pnpm --dir frontend build \
    && pnpm --filter bookit deploy --prod --legacy /app

WORKDIR /app
COPY bookit/src/schemas ./build/schemas
# Deployment copies dependencies without the generated Prisma client.
RUN ./node_modules/.bin/prisma generate

FROM base AS runtime
ENV NODE_ENV=production TZ=Europe/Stockholm
WORKDIR /app
COPY --from=build --chown=node:node /app ./
USER node
EXPOSE 8080
CMD ["node", "./build/index.js"]
