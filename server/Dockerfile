# Express.js Backend
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci 2>/dev/null || npm install

COPY . .

# Generate Prisma client if schema exists
RUN npx prisma generate 2>/dev/null || true

EXPOSE 4000
ENV PORT=4000

# Run migrations then start (src/server.js per PROJECT_PLAN, fallback to index.js)
CMD ["sh", "-c", "npx prisma migrate deploy 2>/dev/null || true; exec npm run dev 2>/dev/null || node src/server.js 2>/dev/null || node ."]
