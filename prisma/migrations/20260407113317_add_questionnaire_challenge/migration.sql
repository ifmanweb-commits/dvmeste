-- AlterEnum
ALTER TYPE "ChallengeType" ADD VALUE 'QUESTIONNAIRE';

-- CreateTable
CREATE TABLE "QuestionnaireChallenge" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "questionsPool" JSONB NOT NULL,
    "timeLimit" INTEGER,
    "reviewPrice" INTEGER,
    "requiredReviews" INTEGER NOT NULL DEFAULT 1,
    "reviewsToPass" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "QuestionnaireChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireSubmission" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "status" "WorkStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewerId" TEXT,
    "approvedCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuestionnaireSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireReview" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "status" "WorkReviewStatus" NOT NULL DEFAULT 'TAKEN',
    "verdict" "ReviewVerdict",
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "QuestionnaireReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionnaireChallenge_challengeId_key" ON "QuestionnaireChallenge"("challengeId");

-- CreateIndex
CREATE INDEX "QuestionnaireChallenge_challengeId_idx" ON "QuestionnaireChallenge"("challengeId");

-- CreateIndex
CREATE INDEX "QuestionnaireSubmission_challengeId_idx" ON "QuestionnaireSubmission"("challengeId");

-- CreateIndex
CREATE INDEX "QuestionnaireSubmission_userId_idx" ON "QuestionnaireSubmission"("userId");

-- CreateIndex
CREATE INDEX "QuestionnaireSubmission_status_idx" ON "QuestionnaireSubmission"("status");

-- CreateIndex
CREATE INDEX "QuestionnaireSubmission_submittedAt_idx" ON "QuestionnaireSubmission"("submittedAt");

-- CreateIndex
CREATE INDEX "QuestionnaireReview_submissionId_idx" ON "QuestionnaireReview"("submissionId");

-- CreateIndex
CREATE INDEX "QuestionnaireReview_supervisorId_idx" ON "QuestionnaireReview"("supervisorId");

-- CreateIndex
CREATE INDEX "QuestionnaireReview_status_idx" ON "QuestionnaireReview"("status");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionnaireReview_submissionId_supervisorId_key" ON "QuestionnaireReview"("submissionId", "supervisorId");

-- AddForeignKey
ALTER TABLE "QuestionnaireChallenge" ADD CONSTRAINT "QuestionnaireChallenge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireSubmission" ADD CONSTRAINT "QuestionnaireSubmission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireSubmission" ADD CONSTRAINT "QuestionnaireSubmission_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireSubmission" ADD CONSTRAINT "QuestionnaireSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireReview" ADD CONSTRAINT "QuestionnaireReview_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "QuestionnaireSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireReview" ADD CONSTRAINT "QuestionnaireReview_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
