-- AlterTable
ALTER TABLE "QuestionnaireSubmission" ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "QuestionnaireSubmission_startedAt_idx" ON "QuestionnaireSubmission"("startedAt");
