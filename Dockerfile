# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
# Install ALL dependencies (including devDependencies) so that build-time tools
# like @tailwindcss/postcss and its native lightningcss binary are available.
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are baked into the JS bundle at build time.
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# Opt out of Next.js telemetry inside CI/Docker builds
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ─── Stage 3: Runtime ─────────────────────────────────────────────────────────
# The Next.js standalone output bundles only the minimal server and its deps,
# so the final image does NOT include node_modules (hundreds of MB saved).
FROM node:20-alpine AS runtime

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
USER nextjs

WORKDIR /app

COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/public ./public

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["node", "server.js"]
