## 📋 ТЗ: Web Push уведомления для психологов (обновленное)

### 1️⃣ Общая информация

**Проект:** Давай вместе — каталог психологов
**Технологии:** Next.js 16 (App Router), Prisma, Tailwind CSS
**Библиотеки:** `web-push` (для сервера)
**Тип задачи:** Реализация push-уведомлений для психологов

### 2️⃣ VAPID ключи (уже сгенерированы)

```env
# .env файл
VAPID_PUBLIC_KEY=BI...
VAPID_PRIVATE_KEY=gH...
VAPID_SUBJECT=mailto:admin@dvmeste.ru
```

### 3️⃣ Модель базы данных (создать)

```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

### 4️⃣ Структура файлов

```
lib/actions/
└── push.ts                # Server Actions для подписки/отписки

app/account/push/
├── page.tsx               # Страница настроек
├── PushClient.tsx         # Клиентский компонент с логикой
└── Instructions.tsx       # Компонент с выдвижными инструкциями

public/
└── sw.js                  # Service Worker
```

### 5️⃣ Server Actions (`lib/actions/push.ts`)

```typescript
// Сохранить подписку пользователя
export async function subscribePush(subscription: PushSubscriptionJSON)

// Удалить подписку по endpoint
export async function unsubscribePush(endpoint: string)

// Получить все подписки текущего пользователя
export async function getUserSubscriptions()

// Проверить, есть ли активная подписка
export async function getPushStatus(): Promise<{ subscribed: boolean }>
```

### 6️⃣ Service Worker (`public/sw.js`)

Регистрируется **только после явного действия пользователя** (нажатия на кнопку "Включить").

```javascript
// Обработка входящего push
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon.png',
      data: data.data
    })
  )
})

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const urlToOpen = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(urlToOpen))
})
```

### 7️⃣ Страница в ЛК (`/account/push/page.tsx`)

**Серверный компонент**, который:
- Проверяет поддержку браузером (`'serviceWorker' in navigator`)
- Получает статус подписки через `getPushStatus()`
- Передает данные в клиентский компонент

### 8️⃣ Клиентский компонент (`PushClient.tsx`)

**Интерфейс:**
- Заголовок "Push-уведомления"
- Описание: "Получайте уведомления о новых событиях даже когда сайт закрыт"
- Кнопка **"Включить уведомления"** / "Выключить" (меняется в зависимости от статуса)
- Если браузер не поддерживает — показывать сообщение

**Логика включения:**
1. Пользователь нажимает "Включить уведомления"
2. Браузер показывает диалог разрешения
3. Если разрешено — регистрируется Service Worker
4. Создается подписка через `pushManager.subscribe()`
5. Подписка отправляется в `subscribePush()`
6. Интерфейс обновляется (кнопка "Выключить")

**Логика выключения:**
1. Найти все подписки пользователя
2. Для каждой вызвать `unsubscribePush()`
3. Обновить интерфейс

### 9️⃣ Компонент инструкций (`Instructions.tsx`)

Три кнопки: **💻 Десктоп** | **📱 Android** | **🍎 iOS**

При клике — выдвигается блок с соответствующей инструкцией:

**💻 Десктоп:**
- Chrome: разрешить уведомления в диалоге
- Другие браузеры: аналогично

**📱 Android:**
- Разрешить уведомления в диалоге
- Для надежности: добавить сайт на главный экран

**🍎 iOS:**
- Нажать "Поделиться" (квадратик со стрелкой)
- Выбрать "На экран «Домой»"
- Открыть приложение с рабочего стола
- Разрешить уведомления

### 🔟 Важные требования

1. **Никаких автоматических запросов** — подписка только после явного клика
2. Service Worker регистрируется **только при включении**, не при загрузке страницы
3. Состояние кнопки синхронизировано с реальной подпиской
4. При ошибках — понятные сообщения пользователю

### 1️⃣1️⃣ Последовательность реализации

1. Создать модель `PushSubscription` и применить миграцию
2. Написать Server Actions
3. Создать Service Worker
4. Создать страницу и компоненты
5. Протестировать на всех платформах

### 1️⃣2️⃣ Интеграция (позже)

Пока без интеграции с заявками — только базовая подписка. Функция отправки будет добавлена позже.