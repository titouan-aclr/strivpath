# =============================================================================
# StrivPath API - Multi-stage Docker Build
# =============================================================================
# This Dockerfile creates an optimized production image for the NestJS API.
# It uses turbo prune to extract only the necessary workspace packages.
#
# Required environment variables at runtime:
#   - DATABASE_URL: PostgreSQL connection string
#   - JWT_ACCESS_TOKEN_SECRET: Secret for access token signing (min 32 chars)
#   - JWT_REFRESH_TOKEN_SECRET: Secret for refresh token signing (min 32 chars)
#   - STRAVA_CLIENT_ID: Strava OAuth application client ID
#   - STRAVA_CLIENT_SECRET: Strava OAuth application secret
#   - STRAVA_REDIRECT_URI: OAuth callback URL
#   - FRONTEND_URL: Frontend application URL for CORS
#
# Build command (from monorepo root):
#   docker build -f apps/api/Dockerfile -t strivpath-api .
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Pruner - Extract API workspace with turbo prune
# -----------------------------------------------------------------------------
FROM node:24-alpine AS pruner
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate
WORKDIR /app

COPY . .
RUN pnpm dlx turbo@^2 prune api --docker

# -----------------------------------------------------------------------------
# Stage 2: Builder - Install all dependencies and build the application
# -----------------------------------------------------------------------------
FROM node:24-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate
WORKDIR /app

# Copy lockfile and package.json files from pruned output
COPY --from=pruner /app/out/json/ .

# Install all dependencies (including devDependencies for build)
RUN echo "shamefully-hoist=true" >> .npmrc && \
    pnpm install --frozen-lockfile --ignore-scripts

# Copy source code from pruned output
COPY --from=pruner /app/out/full/ .

# Generate Prisma client (creates node_modules/.prisma with query engine)
RUN pnpm --filter api exec prisma generate

# Build the NestJS application
RUN pnpm --filter api build

# Compile the seed script separately (not included in nest build)
RUN pnpm --filter api exec tsc prisma/seed.ts --outDir dist/prisma --esModuleInterop --skipLibCheck

# -----------------------------------------------------------------------------
# Stage 3: Production Dependencies - Install only production deps
# -----------------------------------------------------------------------------
FROM node:24-alpine AS prod-deps
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate
WORKDIR /app

# Copy package files from pruned output
COPY --from=pruner /app/out/json/ .

# Install production dependencies only
RUN echo "shamefully-hoist=true" >> .npmrc && \
    pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy the generated Prisma client from builder
# The .prisma directory contains the generated client with query engine
COPY --from=builder /app/node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/ ./node_modules/@prisma/client/
COPY --from=builder /app/node_modules/.pnpm/@prisma+client*/node_modules/.prisma/ ./node_modules/.prisma/

# Copy prisma CLI for migrations (needed at runtime)
COPY --from=builder /app/node_modules/.pnpm/prisma@*/node_modules/prisma/ ./node_modules/prisma/
COPY --from=builder /app/node_modules/.pnpm/@prisma+engines@*/node_modules/@prisma/engines/ ./node_modules/@prisma/engines/
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

# -----------------------------------------------------------------------------
# Stage 4: Runner - Minimal production image
# -----------------------------------------------------------------------------
FROM node:24-alpine AS runner

# Install wget for healthcheck and dumb-init for proper signal handling
RUN apk add --no-cache wget dumb-init

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./package.json

# Copy Prisma schema (needed for migrations at runtime)
COPY --from=pruner --chown=nestjs:nodejs /app/apps/api/prisma ./prisma

# Copy entrypoint script
COPY --from=pruner --chown=nestjs:nodejs /app/apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Copy production node_modules
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# Switch to non-root user
USER nestjs

# Expose API port
EXPOSE 3011

# Set production environment
ENV NODE_ENV=production
ENV PORT=3011

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget -qO- http://localhost:3011/health || exit 1

# Use dumb-init to handle signals properly (graceful shutdown)
ENTRYPOINT ["dumb-init", "--", "./docker-entrypoint.sh"]
