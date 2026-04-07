/*
  Warnings:

  - The `status` column on the `QuestionnaireSubmission` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "QuestionnaireStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "QuestionnaireSubmission" DROP COLUMN "status",
ADD COLUMN     "status" "QuestionnaireStatus" NOT NULL DEFAULT 'SUBMITTED';

-- CreateIndex
CREATE INDEX "QuestionnaireSubmission_status_idx" ON "QuestionnaireSubmission"("status");
