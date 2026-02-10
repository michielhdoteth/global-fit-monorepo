FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

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
  CMD node -e "require('http').get('http://localhost:2901/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "gateway.js"]
