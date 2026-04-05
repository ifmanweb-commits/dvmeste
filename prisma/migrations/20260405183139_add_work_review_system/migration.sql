/*
  Warnings:

  - You are about to drop the column `comment` on the `WorkSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `reviewCount` on the `WorkSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `WorkSubmission` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ReviewVerdict" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WorkReviewStatus" AS ENUM ('TAKEN', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "WorkSubmission" DROP COLUMN "comment",
DROP COLUMN "reviewCount",
DROP COLUMN "reviewedAt",
ADD COLUMN     "approvedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rejectedCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "WorkReview" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "status" "WorkReviewStatus" NOT NULL DEFAULT 'TAKEN',
    "verdict" "ReviewVerdict",
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "WorkReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkReview_submissionId_idx" ON "WorkReview"("submissionId");

-- CreateIndex
CREATE INDEX "WorkReview_supervisorId_idx" ON "WorkReview"("supervisorId");

-- CreateIndex
CREATE INDEX "WorkReview_status_idx" ON "WorkReview"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkReview_submissionId_supervisorId_key" ON "WorkReview"("submissionId", "supervisorId");

-- AddForeignKey
ALTER TABLE "WorkReview" ADD CONSTRAINT "WorkReview_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "WorkSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkReview" ADD CONSTRAINT "WorkReview_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
