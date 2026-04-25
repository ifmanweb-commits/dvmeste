# Dockerfile
FROM node:20 AS base

# Устанавливаем зависимости только для production
FROM base AS deps

# Установка системных зависимостей для canvas
RUN apt-get update && apt-get install -y \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Сборка приложения
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

# Создаем папку для загрузок с правильными правами
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

# Собираем приложение
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production образ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Установка fontconfig и postgresql-client для работы со шрифтами и бекапов БД
RUN apt-get update && apt-get install -y fontconfig postgresql-client && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем шрифты в системную папку
COPY private/PT-Serif/PT_Serif-Web-Regular.ttf /usr/share/fonts/truetype/
COPY private/PT-Serif/PT_Serif-Web-Bold.ttf /usr/share/fonts/truetype/
RUN fc-cache -fv

# Копируем standalone сборку
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Создаем папки для загрузок и выдаем права приложению
RUN mkdir -p /app/uploads /app/public/uploads /app/public/articles/files /app/public/pages/files \
  && chown -R nextjs:nodejs /app/uploads /app/public/uploads /app/public/articles /app/public/pages

# Указываем постоянные директории как volume
VOLUME ["/app/uploads", "/app/public/uploads", "/app/public/articles/files", "/app/public/pages/files"]

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV UPLOAD_DIR="/app/uploads"

CMD ["node", "server.js"]
