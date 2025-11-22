# Backend Dockerfile for Cloud Run
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY backend/package.json ./
RUN npm install --production

# Copy backend source
COPY backend/ ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server.js"]

