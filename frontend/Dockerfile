# Build from the repository root: docker build -f frontend/Dockerfile .
FROM node:24.19.0-bookworm-slim AS build
ENV CI=true COREPACK_HOME=/opt/corepack
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate
WORKDIR /workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
RUN pnpm install --frozen-lockfile --filter @bookit/frontend
COPY frontend ./frontend
RUN pnpm --dir frontend build

FROM nginx:1.30.0-alpine
COPY frontend/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/frontend/dist /usr/share/nginx/html
EXPOSE 80
