# ==========================================
# TaskFlow Backend Production Dockerfile
# Multi-Stage / Lightweight Node.js 22 LTS
# ==========================================

FROM node:22-alpine AS runtime

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Install curl/wget for health checks if needed
RUN apk add --no-cache wget

# Create application directory
WORKDIR /app

# Copy dependency manifests first for optimal Docker layer caching
COPY package.json package-lock.json ./

# Install production dependencies only using lockfile
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source code
COPY . .

# Ensure upload directory exists and set permissions for non-root user
RUN mkdir -p /app/uploads && chown -R node:node /app

# Switch to non-root user
USER node

# Expose backend REST API port
EXPOSE 5000

# Health check using backend /api/health endpoint
HEALTHCHECK --interval=20s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start backend using Node.js directly (PID 1 receives SIGTERM/SIGINT signals cleanly)
CMD ["node", "server.js"]
