# --- Dependencies ---
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# --- Build ---
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* is inlined into the bundle at build time, so the public address
# has to be known HERE. Passing it only at runtime would leave metadataBase
# pointing at localhost and every shared link preview broken.
ARG NEXT_PUBLIC_SITE_URL="http://localhost:3000"
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
# Same reason: middleware runs in the Edge runtime, where env vars are inlined
# at build time. Supplying ADMIN_HOST only at container start would leave the
# admin/public host split switched off.
ARG ADMIN_HOST=""
ENV ADMIN_HOST=$ADMIN_HOST
RUN npx prisma generate && npm run build

# --- Migrator ---
# One-shot image that still has devDependencies (prisma CLI, tsx), used by the
# `migrate` and `seed` compose services. Keeping these out of the runtime image
# keeps it small while making schema pushes and seeding actually runnable.
FROM node:22-alpine AS migrator
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
# Same uid the app runs as, so the SQLite file this stage creates on the shared
# volume stays writable by the web container.
RUN mkdir -p /app/data && chown -R 1001:1001 /app/data
CMD ["npx", "prisma", "db", "push", "--skip-generate"]

# --- Runtime ---
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Next standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Prisma query engine + generated client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Both the uploads and the SQLite database live on mounted volumes. Creating
# them here with the right owner matters: Docker seeds a fresh named volume
# from the image directory, including its ownership.
RUN mkdir -p ./public/uploads /app/data \
    && chown -R nextjs:nodejs ./public/uploads /app/data

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
