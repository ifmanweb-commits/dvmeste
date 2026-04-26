#!/bin/bash
# ============================================
# СКРИПТ ПЕРВОГО ЗАПУСКА DVMESTE.RU
# ============================================
# Используется при первом развёртывании на новом сервере
# Создаёт базу данных, применяет схему и заполняет сид-данными
# ============================================

set -e  # Выход при ошибке

echo "🚀 Начало первого запуска dvmeste.ru..."

# Проверка наличия docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose не найден. Установите Docker Compose."
    exit 1
fi

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    echo "   Скопируйте .env.example в .env и заполните значения:"
    echo "   cp .env.example .env"
    exit 1
fi

echo ""
echo "📦 Шаг 1/5: Поднятие PostgreSQL..."
docker-compose up -d postgres

echo ""
echo "⏳ Шаг 2/5: Ожидание готовности PostgreSQL (30 секунд)..."
sleep 30

# Проверка доступности базы
echo ""
echo "🔍 Проверка подключения к PostgreSQL..."
docker-compose exec -T postgres pg_isready -U dvmeste -d dvmeste_db || {
    echo "❌ PostgreSQL не готов. Проверьте логи:"
    docker-compose logs postgres
    exit 1
}

echo ""
echo "✅ PostgreSQL готов!"

echo ""
echo "📦 Шаг 3/5: Применение схемы базы данных (prisma db push)..."
docker-compose run --rm app npx prisma db push

echo ""
echo "📦 Шаг 4/5: Заполнение базы начальными данными..."
docker-compose run --rm app npx tsx prisma/seed-initial.ts

echo ""
echo "📦 Шаг 5/5: Запуск приложения..."
docker-compose up -d app

echo ""
echo "============================================"
echo "✅ ПЕРВЫЙ ЗАПУСК ЗАВЕРШЁН!"
echo "============================================"
echo ""
echo "📌 Следующие шаги:"
echo "   1. Проверьте логи приложения: docker-compose logs -f app"
echo "   2. Сгенерируйте VAPID ключи: npx tsx scripts/generate-vapid-keys.ts"
echo "   3. Обновите .env новыми VAPID ключами"
echo "   4. Перезапустите приложение: docker-compose restart app"
echo "   5. Настройте Caddy для проксирования на localhost:3001"
echo ""
echo "🌐 Сайт будет доступен на http://localhost:3001"
echo ""