FROM node:24.19.0-bookworm-slim AS base
ENV COREPACK_HOME=/opt/corepack
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && apt-get clean
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate && pnpm --version
WORKDIR /workspace

FROM base AS build
ENV CI=true
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY bookit/package.json ./bookit/package.json
COPY frontend/package.json ./frontend/package.json
COPY bookit/prisma ./bookit/prisma
COPY bookit/prisma.config.ts ./bookit/prisma.config.ts
RUN pnpm install --frozen-lockfile --filter bookit --filter @bookit/frontend
COPY bookit ./bookit
COPY frontend ./frontend
RUN pnpm --dir bookit exec prisma generate \
    && pnpm --dir bookit build \
    && pnpm --dir frontend build \
    && node -e 'require("node:fs").cpSync("bookit/src/schemas", "bookit/build/schemas", { recursive: true })' \
    && pnpm --filter bookit deploy --prod --legacy /app \
    && node -e 'require("node:fs").copyFileSync("pnpm-workspace.yaml", "/app/pnpm-workspace.yaml")'

WORKDIR /app
RUN ./node_modules/.bin/prisma generate

FROM base AS runtime
ENV NODE_ENV=production TZ=Europe/Stockholm
WORKDIR /app
COPY --from=build --chown=node:node /app ./
USER node
EXPOSE 8080
CMD ["sh", "./startup.sh"]
