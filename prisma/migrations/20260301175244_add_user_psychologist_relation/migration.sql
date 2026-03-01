/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `psychologists` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "psychologists" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "psychologists_userId_key" ON "psychologists"("userId");

-- AddForeignKey
ALTER TABLE "psychologists" ADD CONSTRAINT "psychologists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
