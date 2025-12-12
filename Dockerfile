# Production Stage - Run Express Server (for API Proxy)
FROM node:20-alpine
WORKDIR /app

# Setup dependencies (NPM creates package-lock.json automatically)
RUN npm install express cors

# Copy Server and Dist
COPY server.mjs .
COPY dist ./dist

# Google Cloud Run expects port 8080 by default
ENV PORT=8080
CMD ["node", "server.mjs"]
