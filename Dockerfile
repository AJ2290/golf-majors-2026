FROM node:20-slim AS base

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL="file:/data/golf.db"

EXPOSE 3000

# Start script: run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
