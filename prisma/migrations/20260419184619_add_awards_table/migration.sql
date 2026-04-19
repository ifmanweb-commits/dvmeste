/*
  Warnings:

  - You are about to drop the column `awardText` on the `Certification` table. All the data in the column will be lost.
  - You are about to drop the column `badgeUrl` on the `Certification` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `Certification` table. All the data in the column will be lost.
  - You are about to drop the column `rewardType` on the `Certification` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AwardType" AS ENUM ('CERTIFICATE', 'BADGE');

-- DropIndex
DROP INDEX "Certification_isPublic_idx";

-- AlterTable
ALTER TABLE "Certification" DROP COLUMN "awardText",
DROP COLUMN "badgeUrl",
DROP COLUMN "isPublic",
DROP COLUMN "rewardType",
ADD COLUMN     "awardId" TEXT;

-- AlterTable
ALTER TABLE "CertificationAward" ADD COLUMN     "awardId" TEXT;

-- CreateTable
CREATE TABLE "Award" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AwardType" NOT NULL,
    "badgeUrl" TEXT,
    "certificateTemplateId" TEXT,
    "awardText" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Award_type_idx" ON "Award"("type");

-- CreateIndex
CREATE INDEX "Award_isPublic_idx" ON "Award"("isPublic");

-- CreateIndex
CREATE INDEX "Certification_awardId_idx" ON "Certification"("awardId");

-- CreateIndex
CREATE INDEX "CertificationAward_awardId_idx" ON "CertificationAward"("awardId");

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_awardId_fkey" FOREIGN KEY ("awardId") REFERENCES "Award"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationAward" ADD CONSTRAINT "CertificationAward_awardId_fkey" FOREIGN KEY ("awardId") REFERENCES "Award"("id") ON DELETE SET NULL ON UPDATE CASCADE;
