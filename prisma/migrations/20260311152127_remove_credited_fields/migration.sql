/*
  Warnings:

  - You are about to drop the column `creditedMonth` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `creditedYear` on the `Article` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Article_creditedYear_creditedMonth_idx";

-- AlterTable
ALTER TABLE "Article" DROP COLUMN "creditedMonth",
DROP COLUMN "creditedYear";
