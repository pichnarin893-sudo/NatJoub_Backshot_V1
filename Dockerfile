# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for potential build steps)
RUN npm ci

# Copy application source code
COPY . .

# Stage 2: Production
FROM node:20-alpine AS production

# Install dumb-init and postgresql-client for proper signal handling and database operations
# This ensures SIGTERM signals are properly forwarded to the Node.js process
RUN apk add --no-cache dumb-init postgresql-client

# Create non-root user for security
# Running as non-root is a security best practice
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including sequelize-cli for migrations)
RUN npm ci && \
    npm cache clean --force

# Copy application files from builder stage
# --chown ensures files are owned by nodejs user
COPY --from=builder --chown=nodejs:nodejs /app /app

# Copy and set permissions for entrypoint script
COPY --chown=nodejs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3000

# Health check for Docker
# Checks if the application is responding on the root endpoint
# interval: Check every 30 seconds
# timeout: Wait 10 seconds for response
# start-period: Give app 60 seconds to start (increased for migrations)
# retries: Retry 3 times before marking unhealthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
# This prevents zombie processes and ensures graceful shutdowns
ENTRYPOINT ["dumb-init", "--"]

# Use the entrypoint script that runs migrations before starting the app
CMD ["/app/docker-entrypoint.sh"]
