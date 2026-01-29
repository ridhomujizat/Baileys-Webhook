FROM node:20-alpine AS frontend-builder

WORKDIR /app/dashboard-react

# Copy frontend package files
COPY dashboard-react/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source
COPY dashboard-react/ ./

# Build frontend
RUN npm run build

# ===================
# Backend Builder
# ===================
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Copy backend package files
COPY package*.json ./

# Install build tools and dependencies
RUN apk add --no-cache python3 make g++
RUN npm ci

# Copy backend source
COPY src/ ./src/
COPY tsconfig.json ./

# Build backend TypeScript
RUN npm run build

# ===================
# Production Image
# ===================
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy backend package files
COPY package*.json ./

# Install production dependencies only
RUN apk add --no-cache python3 make g++ && \
    npm ci --only=production && \
    apk del python3 make g++ && \
    npm cache clean --force

# Copy built backend from builder
COPY --from=backend-builder /app/dist ./dist

# Copy built frontend from frontend-builder
COPY --from=frontend-builder /app/dashboard-react/../public ./public

# Create sessions directory with proper permissions
RUN mkdir -p sessions && chown -R node:node /app

# Switch to non-root user
USER node

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV STATIC_PATH=/app/public

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start with dumb-init for proper signal handling
CMD ["dumb-init", "node", "dist/app.js"]
