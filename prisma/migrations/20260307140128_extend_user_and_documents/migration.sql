/*
  Warnings:

  - You are about to alter the column `contactInfo` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(150)`.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentType" ADD VALUE 'QUALIFICATION';
ALTER TYPE "DocumentType" ADD VALUE 'COURSE';
ALTER TYPE "DocumentType" ADD VALUE 'SESSION_RECORD_LINK';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "organization" TEXT,
ADD COLUMN     "programName" TEXT,
ADD COLUMN     "year" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "draftData" JSON DEFAULT '{}',
ADD COLUMN     "hasUnpublishedChanges" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "contactInfo" SET DATA TYPE VARCHAR(150);
