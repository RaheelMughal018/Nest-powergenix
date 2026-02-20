# ---- Build ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install all deps (including devDependencies for build)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# ---- Production ----
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Production deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Prisma schema + migrations + generated client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma/

# Built app
COPY --from=builder /app/dist ./dist

# Railway sets PORT
EXPOSE 3333

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
