# ==========================================
# TaskFlow Frontend Production Dockerfile
# Multi-Stage Build: Node.js 22 LTS -> Nginx
# ==========================================

# Stage 1: Build production React application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies required for Vite build)
RUN npm ci

# Copy client source code
COPY . .

# Set build-time Vite API URL (defaults to /api which is proxied by Nginx)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Build production bundle with Vite
RUN npm run build

# Stage 2: Serve static production assets via lightweight Nginx Alpine
FROM nginx:1.27-alpine AS production

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built production assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration (SPA routing + reverse proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose web server port
EXPOSE 80

# Health check to ensure Nginx is responding
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
