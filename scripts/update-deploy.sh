#!/bin/bash
# ============================================
# СКРИПТ ОБНОВЛЕНИЯ DVMESTE.RU
# ============================================
# Используется для обновления существующего развёртывания
# Применяет миграции базы данных и перезапускает приложение
# ============================================

set -e  # Выход при ошибке

echo "🔄 Начало обновления dvmeste.ru..."

# Проверка наличия docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose не найден. Установите Docker Compose."
    exit 1
fi

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    exit 1
fi

echo ""
echo "📦 Шаг 1/6: Остановка приложения..."
docker-compose stop app

echo ""
echo "📦 Шаг 2/6: Pull нового кода (git pull)..."
# Предполагается, что git pull уже сделан вручную перед запуском скрипта
# Если нужно раскомментировать:
# git pull origin main

echo ""
echo "📦 Шаг 3/6: Пересборка Docker образа..."
docker-compose build

echo ""
echo "📦 Шаг 4/6: Поднятие PostgreSQL (если не запущен)..."
docker-compose up -d postgres

echo ""
echo "⏳ Шаг 5/6: Ожидание готовности PostgreSQL..."
sleep 10

# Проверка доступности базы
docker-compose exec -T postgres pg_isready -U dvmeste -d dvmeste_db || {
    echo "❌ PostgreSQL не готов. Проверьте логи:"
    docker-compose logs postgres
    exit 1
}

echo ""
echo "📦 Шаг 6/6: Применение изменений базы данных..."
# Проверка наличия миграций в папке prisma/migrations
if [ -z "$(ls -A prisma/migrations 2>/dev/null)" ]; then
    echo "⚠️  Папка migrations пуста. Используем prisma db push..."
    docker-compose run --rm app npx prisma db push
else
    echo "📦 Применение миграций базы данных..."
    docker-compose run --rm app npx prisma migrate deploy
fi

echo ""
echo "🔄 Перезапуск приложения..."
docker-compose up -d app --force-recreate

echo ""
echo "============================================"
echo "✅ ОБНОВЛЕНИЕ ЗАВЕРШЕНО!"
echo "============================================"
echo ""
echo "📌 Проверка:"
echo "   - Просмотр логов: docker-compose logs -f app"
echo "   - Статус контейнеров: docker-compose ps"
echo ""