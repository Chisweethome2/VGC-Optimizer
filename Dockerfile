FROM node:24-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY lib/db/package.json lib/db/
COPY lib/api-zod/package.json lib/api-zod/
COPY lib/api-client-react/package.json lib/api-client-react/
COPY lib/api-spec/package.json lib/api-spec/
COPY artifacts/api-server/package.json artifacts/api-server/
COPY artifacts/vgc-teambuilder/package.json artifacts/vgc-teambuilder/
RUN pnpm install --frozen-lockfile
COPY . .
RUN cd artifacts/vgc-teambuilder && npx vite build --config vite.config.ts
RUN mkdir -p artifacts/api-server/public && cp -r artifacts/vgc-teambuilder/dist/public/* artifacts/api-server/public/
RUN cd artifacts/api-server && pnpm run build

FROM node:24-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY --from=builder /app/artifacts/api-server/dist ./dist
COPY --from=builder /app/artifacts/api-server/public ./public
COPY --from=builder /app/artifacts/api-server/node_modules ./node_modules
COPY --from=builder /app/artifacts/api-server/package.json ./
COPY --from=builder /app/node_modules/.pnpm/better-sqlite3@* ./node_modules/better-sqlite3 2>/dev/null || true
RUN if [ -d node_modules/better-sqlite3 ]; then cd node_modules/better-sqlite3 && npm run build-release 2>/dev/null || true; fi
ENV PORT=8080
VOLUME ["/app/data"]
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
