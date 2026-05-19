FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig.json ./
COPY src ./src/

RUN npm ci

RUN npm run build

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && node dist/app.js"]
