/*
  Warnings:

  - Made the column `certificationLevel` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "certificationLevel" SET NOT NULL,
ALTER COLUMN "certificationLevel" SET DEFAULT 0;
