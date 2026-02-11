FROM node:18-alpine

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++ sqlite

# Install bun globally
RUN npm install -g bun

# Install dependencies
COPY package*.json ./
RUN bun install --production

# Copy application code
COPY server.js ./
COPY message-router.js ./
COPY receptionist-logic.js ./
COPY response-router.js ./

# Copy storage db.js to app directory
COPY ../storage/db.js /app/storage/db.js

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S -u 1001 nodejs
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["bun", "server.js"]
