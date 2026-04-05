-- CreateEnum
CREATE TYPE "WorkStatus" AS ENUM ('SUBMITTED', 'REVIEWING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "WorkSubmission" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "transcriptUrl" TEXT NOT NULL,
    "status" "WorkStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewerId" TEXT,
    "comment" TEXT,

    CONSTRAINT "WorkSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkSubmission_challengeId_idx" ON "WorkSubmission"("challengeId");

-- CreateIndex
CREATE INDEX "WorkSubmission_userId_idx" ON "WorkSubmission"("userId");

-- CreateIndex
CREATE INDEX "WorkSubmission_status_idx" ON "WorkSubmission"("status");

-- CreateIndex
CREATE INDEX "WorkSubmission_submittedAt_idx" ON "WorkSubmission"("submittedAt");

-- AddForeignKey
ALTER TABLE "WorkSubmission" ADD CONSTRAINT "WorkSubmission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSubmission" ADD CONSTRAINT "WorkSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSubmission" ADD CONSTRAINT "WorkSubmission_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
