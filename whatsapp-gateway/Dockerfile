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
COPY gateway.js ./
COPY qr-handler.js ./
COPY session-manager.js ./

# Create directories
RUN mkdir -p sessions storage

# Expose port
EXPOSE 2901

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:2901/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["bun", "gateway.js"]
