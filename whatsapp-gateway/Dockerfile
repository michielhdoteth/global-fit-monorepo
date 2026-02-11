FROM oven/bun:1-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN bun install --production

# Copy application code
COPY gateway.js ./
COPY qr-handler.js ./
COPY session-manager.js ./

# Create directories
RUN mkdir -p sessions storage

# Expose port (will be overridden by docker-compose)
EXPOSE 2901

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:2901/health').then(r=>process.exit(r.ok?0:1))"

# Start application
CMD ["bun", "gateway.js"]
