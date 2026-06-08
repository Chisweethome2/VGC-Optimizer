FROM node:24-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY artifacts/api-server/package.json ./
RUN npm install better-sqlite3 drizzle-orm
COPY artifacts/api-server/dist ./dist
COPY artifacts/api-server/public ./public
ENV PORT=8080
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
