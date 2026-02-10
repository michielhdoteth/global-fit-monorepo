FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create directories
RUN mkdir -p sessions storage

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
