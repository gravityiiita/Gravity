# Build context is this directory (my-app), not the repo root.
# From the repo root:
#   docker build -t akshatga/gravity:0.0.1 ./my-app
# From this directory:
#   docker build -t akshatga/gravity:0.0.1 .
FROM node:20-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./

# package-lock.json must be in git. Without it, CI falls through to `npm install`
# and floats next/react (16.3.8 / 19.3) while local Docker uses npm ci (16.1.4 / 19.2.3).
RUN npm ci

# Stage 2: Build the Next.js app
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 3: Production image (Next.js standalone)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
