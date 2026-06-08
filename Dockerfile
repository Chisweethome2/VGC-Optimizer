FROM node:24-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY artifacts/api-server/dist ./dist
COPY artifacts/api-server/public ./public
RUN npm init -y > /dev/null 2>&1 && npm install better-sqlite3
ENV PORT=8080
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
