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

# Собираем приложение
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production образ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Установка fontconfig, postgresql-client и gzip для работы со шрифтами и бекапов БД
RUN apt-get update && apt-get install -y fontconfig postgresql-client gzip && rm -rf /var/lib/apt/lists/*

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

# Создаем папки для данных и выдаем права приложению
# Эти папки монтируются как volumes для сохранения данных при перезапуске
RUN mkdir -p /app/public/articles/files \
  /app/public/pages/files \
  /app/public/certificates \
  /app/public/files/articles \
  /app/public/files/pages \
  /app/public/files/secret-pages \
  /app/public/files/users \
  /app/public/images/certificates-tmpl \
  /app/public/images/certification-badges \
  /app/public/images/edu-icons \
  /app/public/images/icons \
  /app/backups \
  && chown -R nextjs:nodejs /app/public/files \
  /app/public/images \
  /app/backups

# Указываем постоянные директории как volume
VOLUME ["/app/public/articles/files", "/app/public/pages/files", "/app/public/certificates", "/app/public/files/articles", "/app/public/files/pages", "/app/public/files/secret-pages", "/app/public/files/users", "/app/public/images/certificates-tmpl", "/app/public/images/certification-badges", "/app/public/images/edu-icons", "/app/public/images/icons", "/app/backups"]

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
