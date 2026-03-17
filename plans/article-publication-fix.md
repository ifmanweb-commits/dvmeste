# План исправления публикации статей и улучшения формы редактирования

## Проблема
Публикация статьи из формы не работает корректно - показывает что опубликовано, но в базе данных isPublished остается false. Нужно проверить и исправить логику публикации по всему сайту.

## Анализ текущей системы

### Текущая структура базы данных
- **Article модель**: `isPublished: Boolean @default(false)`, `publishedAt: DateTime?`
- **User модель**: `isPublished: Boolean @default(false)`

### Текущая логика публикации
1. В функции `updateArticle` (lib/articles.ts:272-274):
   ```typescript
   if (data.isPublished !== undefined) {
     updateData.publishedAt = data.isPublished ? new Date() : null;
   }
   ```
   **Проблема**: не обновляется поле `isPublished`, только `publishedAt`

2. В форме (components/articles/ArticleForm.tsx:528-537):
   ```typescript
   <input
       type="checkbox"
       checked={isPublished}
       onChange={e => setIsPublished(e.target.checked)}
       id="isPublished"
   />
   <label htmlFor="isPublished" className="font-medium text-gray-700">Опубликовать</label>
   ```

3. В API (app/api/articles/[id]/route.ts:31-50):
   Передает данные в `updateArticle` без изменений

## Детальный план решения

### 1. Анализ и проверка публикации статей
**Цель**: Исправить логику публикации, чтобы `isPublished` правильно обновлялся в базе

**Шаги**:
1.1. В функции `updateArticle` (lib/articles.ts) добавить обновление поля `isPublished`:
   ```typescript
   if (data.isPublished !== undefined) {
     updateData.isPublished = data.isPublished;
     updateData.publishedAt = data.isPublished ? new Date() : null;
   }
   ```

1.2. Проверить все функции выборки статей:
   - `getArticles()` - использует `publishedAt: { not: null }` для `publishedOnly`
   - `getArticleTags()` - использует `publishedAt: { not: null }`
   - `getArticlesForAdmin()` - использует `isPublished: false` для `unpublishedOnly`

1.3. Унифицировать фильтрацию: везде использовать `publishedAt` вместо `isPublished` для проверки опубликованности

### 2. Исправление формы редактирования статьи
**Цель**: Добавить отображение ID, улучшить генерацию slug

**Шаги**:
2.1. В странице редактирования (app/(admin)/admin/articles/[id]/edit/page.tsx):
   - Добавить отображение ID статьи вверху формы
   - Обернуть ArticleForm в дополнительный контейнер с ID

2.2. В компоненте ArticleForm (components/articles/ArticleForm.tsx):
   - Добавить кнопку "Генерировать" рядом с полем slug
   - Реализовать функцию генерации slug из названия или ID
   - Добавить проверку уникальности slug через API `/api/articles/check-slug`
   - Реализовать автоматическую генерацию уникального slug с цифрами

2.3. Создать функцию генерации уникального slug:
   ```typescript
   async function generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
     let slug = baseSlug;
     let counter = 1;
     
     while (true) {
       const exists = await checkSlugExists(slug, excludeId);
       if (!exists) return slug;
       
       slug = `${baseSlug}-${counter}`;
       counter++;
     }
   }
   ```

### 3. Улучшение кнопки удаления
**Цель**: Сделать кнопку удаления более заметной и добавить подтверждение

**Шаги**:
3.1. В странице редактирования (app/(admin)/admin/articles/[id]/edit/page.tsx):
   - Изменить стиль кнопки удаления на полностью красный
   - Создать компонент модального окна подтверждения
   - Реализовать логику удаления с подтверждением

3.2. Создать компонент DeleteConfirmationModal:
   - Красивое модальное окно с вопросом
   - Кнопки "Отмена" и "Удалить"
   - Анимация и переходы

### 4. Удаление WYSIWYG редактора
**Цель**: Убрать WYSIWYG и оставить только plain text

**Шаги**:
4.1. В компоненте ArticleContentEditor (components/articles/ArticleContentEditor.tsx):
   - Убрать загрузку tinymce
   - Убрать переключатель режимов
   - Оставить только textarea с HTML контентом

4.2. В форме ArticleForm:
   - Передать disabled для wysiwyg переключения
   - Убрать возможность включения WYSIWYG режима

### 5. Проверка фильтрации isPublished по всему сайту
**Цель**: Убедиться, что везде правильно фильтруются опубликованные статьи

**Места для проверки**:
- Админка: таблицы статей, списки
- Account: личный кабинет психолога  
- Основной сайт: библиотека психологов, отображение статей
- API endpoints

**Фильтрация должна использовать**:
- `publishedAt: { not: null }` вместо `isPublished: true`
- Для админки можно оставить оба варианта для гибкости

## Технические детали реализации

### Изменения в lib/articles.ts
```typescript
// В updateArticle добавить:
if (data.isPublished !== undefined) {
  updateData.isPublished = data.isPublished;
  updateData.publishedAt = data.isPublished ? new Date() : null;
}

// В getArticles использовать.publishedAt для publishedOnly
where: {
  ...(publishedOnly ? { publishedAt: { not: null } } : {}),
  ...
}
```

### Изменения в components/articles/ArticleForm.tsx
```typescript
// Добавить кнопку генерации slug:
<button
  type="button"
  onClick={handleGenerateSlug}
  className="absolute right-3 top-[42px] text-blue-600 hover:text-blue-800"
>
  Генерировать
</button>

// Реализовать handleGenerateSlug:
const handleGenerateSlug = async () => {
  const baseSlug = title ? slugFromArticleTitle(title) : articleId;
  const uniqueSlug = await generateUniqueSlug(baseSlug || articleId, articleId);
  setSlug(uniqueSlug);
  setIsSlugManuallyEdited(false);
};
```

### Изменения в app/(admin)/admin/articles/[id]/edit/page.tsx
```typescript
// Изменить кнопку удаления:
<Button 
  size="sm" 
  variant="destructive" 
  onClick={handleDelete}
  className="cursor-pointer bg-red-600 hover:bg-red-700"
>
  <Trash2 size="20" className="mr-1"/> Удалить
</Button>

// Добавить модальное окно подтверждения
```

## Порядок выполнения
1. Сначала исправить логику публикации (самая критичная проблема)
2. Затем улучшить форму редактирования
3. Потом добавить модальное окно удаления
4. В конце убрать WYSIWYG редактор
5. Проверить все места фильтрации по всему сайту

## Тестирование
- Проверить публикацию статьи из формы
- Убедиться, что в базе isPublished = true
- Проверить генерацию slug
- Проверить удаление с подтверждением
- Убедиться, что WYSIWYG больше не доступен
- Проверить отображение статей на всех страницах сайта