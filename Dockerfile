FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
ARG BASE_PATH=""
ARG SITE_ORIGIN=https://example.com
ARG BAIDU_SITE_VERIFICATION=""
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_STANDALONE=true \
    BASE_PATH=${BASE_PATH} \
    SITE_ORIGIN=${SITE_ORIGIN} \
    BAIDU_SITE_VERIFICATION=${BAIDU_SITE_VERIFICATION}
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    BASE_PATH="" \
    SITE_ORIGIN=https://example.com

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

EXPOSE 3000

USER nextjs
CMD ["node", "server.js"]
