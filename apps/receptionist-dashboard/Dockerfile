# Build stage
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies in monorepo
FROM base AS install
COPY package.json bun.lockb ../packages/**/package.json ./
COPY packages ./packages
RUN bun install --frozen-lockfile

# Build the app
FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# Production stage
FROM base AS release
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json

# Copy necessary workspace packages
COPY --from=build /app/packages ./packages

# Copy the build output
COPY --from=build --chown=nextjs:nodejs /app/apps/receptionist-dashboard/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/receptionist-dashboard/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
