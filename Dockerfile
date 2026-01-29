FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Install dependencies including devDependencies for building
# Install build tools for potential native modules
RUN apk add --no-cache python3 make g++ 
RUN npm ci

COPY . .

# Build the TypeScript code
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN apk add --no-cache python3 make g++ && \
    npm ci --only=production && \
    apk del python3 make g++

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create sessions directory
RUN mkdir -p sessions && chown -R node:node sessions

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/app.js"]
