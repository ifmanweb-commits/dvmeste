-- Добавляем поля с временным разрешением NULL
ALTER TABLE "pages" ADD COLUMN "adminTitle" TEXT;
ALTER TABLE "pages" ADD COLUMN "metaTitle" TEXT;
ALTER TABLE "pages" ADD COLUMN "metaDescription" TEXT;
ALTER TABLE "pages" ADD COLUMN "metaKeywords" TEXT;
ALTER TABLE "pages" ADD COLUMN "metaRobots" TEXT;
ALTER TABLE "pages" ADD COLUMN "customHead" TEXT;

-- Копируем данные из title в adminTitle
UPDATE "pages" SET "adminTitle" = "title";

-- Теперь делаем adminTitle обязательным
ALTER TABLE "pages" ALTER COLUMN "adminTitle" SET NOT NULL;

-- Удаляем старое поле title (оно больше не нужно)
ALTER TABLE "pages" DROP COLUMN "title";