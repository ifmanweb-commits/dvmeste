-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "bonusPoints" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "totalBonus" INTEGER NOT NULL DEFAULT 0;
