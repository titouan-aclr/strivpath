# =============================================================================
# Stravanalytics Web - Multi-stage Docker Build (Next.js Standalone)
# =============================================================================
# This Dockerfile creates an optimized production image for the Next.js frontend.
# It uses the standalone output mode for minimal image size.
#
# Required environment variables at runtime:
#   - NEXT_PUBLIC_GRAPHQL_URL: GraphQL API endpoint for browser (e.g., https://api.example.com/graphql)
#   - GRAPHQL_URL_INTERNAL: (Optional) GraphQL API endpoint for SSR in Docker (e.g., http://api:3011/graphql)
#                          If not set, falls back to NEXT_PUBLIC_GRAPHQL_URL
#
# Build-time arguments:
#   - NEXT_PUBLIC_GRAPHQL_URL: GraphQL API endpoint for build
#
# Build command (from monorepo root):
#   docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_GRAPHQL_URL=https://api.example.com/graphql -t stravanalytics-web .
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Pruner - Extract web workspace with turbo prune
# -----------------------------------------------------------------------------
FROM node:22-alpine AS pruner
RUN corepack enable && corepack prepare pnpm@10.8.1 --activate
WORKDIR /app

COPY . .
RUN pnpm dlx turbo@^2 prune web --docker

# -----------------------------------------------------------------------------
# Stage 2: Builder - Install dependencies and build the application
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.8.1 --activate
WORKDIR /app

# Build argument for GraphQL URL (needed at build time for codegen)
ARG NEXT_PUBLIC_GRAPHQL_URL
ENV NEXT_PUBLIC_GRAPHQL_URL=${NEXT_PUBLIC_GRAPHQL_URL}

# Copy lockfile and package.json files from pruned output
COPY --from=pruner /app/out/json/ .

# Install all dependencies (including devDependencies for build)
RUN echo "shamefully-hoist=true" >> .npmrc && \
    pnpm install --frozen-lockfile --ignore-scripts

# Copy source code from pruned output
COPY --from=pruner /app/out/full/ .

# Copy the API schema for codegen (needed to generate GraphQL types)
COPY --from=pruner /app/apps/api/src/schema.gql ./apps/api/src/schema.gql

# Build the Next.js application (includes codegen via build script)
RUN pnpm --filter web build

# -----------------------------------------------------------------------------
# Stage 3: Runner - Minimal production image with standalone output
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner

# Install wget for healthcheck and dumb-init for proper signal handling
RUN apk add --no-cache wget dumb-init

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Copy standalone build output
# Next.js standalone includes a minimal node_modules with only production deps
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Copy static files (CSS, JS, images)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

# Start the Next.js server with dumb-init for proper signal handling
CMD ["dumb-init", "node", "apps/web/server.js"]