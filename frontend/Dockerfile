# =============================================================================
# KrishiConnect Frontend Multi-Stage Dockerfile
# Stage 1: Build Vite React Production Assets
# Stage 2: Serve via Lightweight Nginx Alpine
# =============================================================================

# Build Stage
FROM node:20-alpine AS build

WORKDIR /app

# Build arguments for API & WebSocket URLs at build time
ARG VITE_API_URL=""
ARG VITE_WS_URL=""

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Run Nginx
CMD ["nginx", "-g", "daemon off;"]
