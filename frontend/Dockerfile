# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./
# Install deps
RUN pnpm install --no-frozen-lockfile || npm install --legacy-peer-deps

COPY . .
# Build (requires VITE_API_BASE_URL to be present in .env or arg)
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx Template (Auto-substituted by Nginx Entrypoint)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Cloud Run Listen Port
ENV PORT=8080

EXPOSE 8080

# Default entrypoint handles envsubst
CMD ["nginx", "-g", "daemon off;"]
