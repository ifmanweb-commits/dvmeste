/*
  Warnings:

  - You are about to drop the column `showFooter` on the `pages` table. All the data in the column will be lost.
  - You are about to drop the column `showHeader` on the `pages` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "pages" DROP COLUMN "showFooter",
DROP COLUMN "showHeader";
