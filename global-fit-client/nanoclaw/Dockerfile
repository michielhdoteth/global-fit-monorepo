FROM oven/bun:1-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN bun install --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S -u 1001 nodejs
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1))"

# Start server
CMD ["bun", "server.js"]
