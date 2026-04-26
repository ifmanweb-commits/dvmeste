# Инструкция по развёртыванию dvmeste.ru

## Требования к серверу

- Ubuntu 20.04+ или другой Linux-дистрибутив
- Docker 20+
- Docker Compose 2+
- Git
- Caddy (для HTTPS и проксирования)

---

## 1. Подготовка сервера

### Установка Docker и Docker Compose

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER
# Выйдите и зайдите заново в систему для применения изменений

# Проверка установки
docker --version
docker-compose --version
```

### Установка Caddy

```bash
# Добавление репозитория Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list

# Установка Caddy
sudo apt update
sudo apt install caddy
```

---

## 2. Клонирование проекта

```bash
# Перейдите в папку для проекта
cd /var/www
# Или в вашу папку

# Клонируйте репозиторий
git clone https://github.com/ifmanweb-commits/dvmeste.git
cd dvmeste
```

---

## 3. Настройка окружения

### Для первого запуска

```bash
# Скопируйте шаблон .env
cp .env.example .env

# Отредактируйте .env и заполните значения
nano .env
```

### Обязательные переменные для продакшена:

| Переменная | Описание | Пример |
|------------|----------|--------|
| `DB_PASSWORD` | Пароль базы данных | `CKC%pXQ#jEA7&*4E` |
| `DATABASE_URL` | URL подключения к БД | `postgresql://dvmeste:PASSWORD@postgres:5432/dvmeste_db` |
| `NEXT_PUBLIC_BASE_URL` | URL сайта | `https://dvmeste.ru` |
| `ADMIN_SESSION_SECRET` | Секрет сессий | `openssl rand -hex 16` |
| `ENCRYPTION_KEY` | Ключ шифрования | (оставить как в .env.example) |
| `UNISENDER_API_KEY` | Ключ Unisender | (ваш ключ) |
| `SMARTCAPTCHA_SERVER_KEY` | Ключ сервера Captcha | (ваш ключ) |
| `NEXT_PUBLIC_SMARTCAPTCHA_CLIENT_KEY` | Ключ клиента Captcha | (ваш ключ) |

### Генерация секретов:

```bash
# ADMIN_SESSION_SECRET (случайная строка 32 символа)
openssl rand -hex 16

# VAPID ключи для WebPush
npx tsx scripts/generate-vapid-keys.ts
```

---

## 4. Первый запуск

```bash
# Сделайте скрипт исполняемым
chmod +x scripts/init-first-deploy.sh

# Запустите скрипт первого развёртывания
./scripts/init-first-deploy.sh
```

Скрипт выполнит:
1. Поднятие PostgreSQL
2. Ожидание готовности БД
3. Применение схемы (prisma db push)
4. Заполнение начальными данными
5. Запуск приложения

---

## 5. Настройка Caddy

### Отредактируйте конфигурацию Caddy:

```bash
sudo nano /etc/caddy/Caddyfile
```

### Добавьте блок для сайта:

```caddyfile
dvmeste.ru {
    reverse_proxy localhost:3001
}

www.dvmeste.ru {
    reverse_proxy localhost:3001
}
```

### Перезапустите Caddy:

```bash
sudo systemctl reload caddy
```

### Проверка статуса:

```bash
sudo systemctl status caddy
```

---

## 6. Обновление (деплой новой версии)

При наличии изменений в коде:

```bash
# Перейдите в папку проекта
cd /var/www/dvmeste

# Получите новые изменения
git pull origin main

# Запустите скрипт обновления
chmod +x scripts/update-deploy.sh
./scripts/update-deploy.sh
```

Скрипт выполнит:
1. Остановку приложения
2. Пересборку Docker образа
3. Применение миграций (prisma migrate deploy)
4. Перезапуск приложения

---

## 7. Полезные команды

### Управление контейнерами:

```bash
# Просмотр статуса контейнеров
docker-compose ps

# Просмотр логов приложения
docker-compose logs -f app

# Просмотр логов базы данных
docker-compose logs -f postgres

# Перезапуск приложения
docker-compose restart app

# Остановка всех сервисов
docker-compose down

# Остановка с удалением volumes (осторожно!)
docker-compose down -v
```

### Бекап базы данных:

```bash
# Создать бекап
docker-compose exec postgres pg_dump -U dvmeste dvmeste_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановить из бекапа
cat backup.sql | docker-compose exec -T postgres psql -U dvmeste -d dvmeste_db
```

---

## 8. Решение проблем

### Приложение не запускается:

```bash
# Проверьте логи
docker-compose logs app

# Проверьте, что PostgreSQL запущен
docker-compose ps postgres

# Проверьте подключение к БД
docker-compose exec postgres pg_isready -U dvmeste -d dvmeste_db
```

### Ошибки миграции:

```bash
# Применить миграции вручную
docker-compose run --rm app npx prisma migrate deploy

# Проверить статус миграций
docker-compose run --rm app npx prisma migrate status
```

### Сброс базы данных (только для разработки!):

```bash
# ОСТОРОЖНО: Удалит все данные!
docker-compose down -v
./scripts/init-first-deploy.sh
```

---

## 9. Структура файлов

```
dvmeste/
├── docker-compose.yml          # Конфигурация Docker Compose
├── Dockerfile                  # Конфигурация Docker образа
├── .env                        # Переменные окружения (не в git!)
├── .env.example                # Шаблон переменных
├── scripts/
│   ├── init-first-deploy.sh    # Скрипт первого запуска
│   ├── update-deploy.sh        # Скрипт обновления
│   └── generate-vapid-keys.ts  # Генерация VAPID ключей
├── prisma/
│   └── schema.prisma           # Схема базы данных
└── ...
```

---

## 10. Контакты

При возникновении проблем обращайтесь к документации Prisma: https://pris.ly/d/migration-guide