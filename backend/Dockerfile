FROM node:24.19.0-bookworm-slim AS base
ENV COREPACK_HOME=/opt/corepack
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && apt-get clean
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate && pnpm --version
WORKDIR /workspace

FROM base AS build
ENV CI=true
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY backend/prisma ./backend/prisma
COPY backend/prisma.config.ts ./backend/prisma.config.ts
RUN pnpm install --frozen-lockfile --filter backend
COPY backend ./backend
RUN pnpm --dir backend exec prisma generate \
    && pnpm --dir backend build \
    && node -e 'require("node:fs").cpSync("backend/src/schemas", "backend/build/schemas", { recursive: true })' \
    && pnpm --filter backend deploy --prod --legacy /app \
    && node -e 'require("node:fs").copyFileSync("pnpm-workspace.yaml", "/app/pnpm-workspace.yaml")'

# Deployment creates a fresh node_modules layout; generate the client there.
WORKDIR /app
RUN ./node_modules/.bin/prisma generate

FROM base AS runtime
ENV NODE_ENV=production TZ=Europe/Stockholm
WORKDIR /app
COPY --from=build --chown=node:node /app ./
USER node
EXPOSE 8080
CMD ["sh", "./startup.sh"]
