/*
  Warnings:

  - You are about to drop the column `unlockPrice` on the `TestChallenge` table. All the data in the column will be lost.
  - You are about to drop the column `reviewPrice` on the `WorkChallenge` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TestChallenge" DROP COLUMN "unlockPrice";

-- AlterTable
ALTER TABLE "WorkChallenge" DROP COLUMN "reviewPrice";
