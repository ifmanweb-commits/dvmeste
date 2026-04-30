#!/bin/bash
# ============================================
# СКРИПТ ОБНОВЛЕНИЯ DVMESTE.RU
# ============================================
# Используется для обновления существующего развёртывания
# Применяет миграции базы данных и перезапускает приложение
# ============================================

set -e  # Выход при ошибке

echo "🔄 Начало обновления dvmeste.ru..."

# Проверка наличия docker compose
if ! command -v docker compose &> /dev/null; then
    echo "❌ docker compose не найден. Установите Docker Compose."
    exit 1
fi

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    exit 1
fi

echo "📦 Шаг 1/5: Pull нового кода..."
git pull origin main

echo "📦 Шаг 2/5: Пересборка Docker образа..."
docker compose build app app-migrate

echo "📦 Шаг 3/5: Пересоздание и запуск контейнеров..."
docker compose up -d --force-recreate postgres app

echo "⏳ Шаг 4/5: Ожидание готовности PostgreSQL..."
sleep 5
docker compose exec -T postgres pg_isready -U dvmeste -d dvmeste_db

echo "📦 Шаг 5/5: Применение миграций..."
docker compose run --rm app-migrate npx prisma migrate deploy

echo ""
docker compose ps

echo ""
echo "============================================"
echo "✅ ОБНОВЛЕНИЕ ЗАВЕРШЕНО!"
echo "============================================"
echo ""
echo "📌 Проверка:"
echo "   - Просмотр логов: docker compose logs -f app"
echo "   - Статус контейнеров: docker compose ps"
echo ""