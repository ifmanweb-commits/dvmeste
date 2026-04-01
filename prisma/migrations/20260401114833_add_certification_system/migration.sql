-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('TEST', 'WORK');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ChallengeType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestChallenge" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "questionsPool" JSONB NOT NULL,
    "questionsCount" INTEGER NOT NULL,
    "passingScore" INTEGER NOT NULL,
    "timeLimit" INTEGER,
    "freeAttempts" INTEGER NOT NULL DEFAULT 2,
    "unlockPrice" INTEGER,

    CONSTRAINT "TestChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkChallenge" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "requiredReviews" INTEGER NOT NULL DEFAULT 1,
    "reviewsToPass" INTEGER NOT NULL DEFAULT 1,
    "reviewPrice" INTEGER,

    CONSTRAINT "WorkChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeAttempt" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "passed" BOOLEAN,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "selectedQuestionIndices" JSONB,
    "answers" JSONB,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeUserState" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attemptsLeft" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeUserState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificationRequirement" (
    "id" TEXT NOT NULL,
    "certificationId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CertificationRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificationAward" (
    "id" TEXT NOT NULL,
    "certificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificationAward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_slug_key" ON "Challenge"("slug");

-- CreateIndex
CREATE INDEX "Challenge_slug_idx" ON "Challenge"("slug");

-- CreateIndex
CREATE INDEX "Challenge_type_idx" ON "Challenge"("type");

-- CreateIndex
CREATE INDEX "Challenge_isActive_idx" ON "Challenge"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TestChallenge_challengeId_key" ON "TestChallenge"("challengeId");

-- CreateIndex
CREATE INDEX "TestChallenge_challengeId_idx" ON "TestChallenge"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkChallenge_challengeId_key" ON "WorkChallenge"("challengeId");

-- CreateIndex
CREATE INDEX "WorkChallenge_challengeId_idx" ON "WorkChallenge"("challengeId");

-- CreateIndex
CREATE INDEX "ChallengeAttempt_challengeId_idx" ON "ChallengeAttempt"("challengeId");

-- CreateIndex
CREATE INDEX "ChallengeAttempt_userId_idx" ON "ChallengeAttempt"("userId");

-- CreateIndex
CREATE INDEX "ChallengeAttempt_status_idx" ON "ChallengeAttempt"("status");

-- CreateIndex
CREATE INDEX "ChallengeUserState_userId_idx" ON "ChallengeUserState"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeUserState_challengeId_userId_key" ON "ChallengeUserState"("challengeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Certification_slug_key" ON "Certification"("slug");

-- CreateIndex
CREATE INDEX "Certification_slug_idx" ON "Certification"("slug");

-- CreateIndex
CREATE INDEX "Certification_isActive_idx" ON "Certification"("isActive");

-- CreateIndex
CREATE INDEX "CertificationRequirement_certificationId_idx" ON "CertificationRequirement"("certificationId");

-- CreateIndex
CREATE INDEX "CertificationRequirement_challengeId_idx" ON "CertificationRequirement"("challengeId");

-- CreateIndex
CREATE INDEX "CertificationAward_userId_idx" ON "CertificationAward"("userId");

-- CreateIndex
CREATE INDEX "CertificationAward_certificationId_idx" ON "CertificationAward"("certificationId");

-- AddForeignKey
ALTER TABLE "TestChallenge" ADD CONSTRAINT "TestChallenge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkChallenge" ADD CONSTRAINT "WorkChallenge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeAttempt" ADD CONSTRAINT "ChallengeAttempt_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeAttempt" ADD CONSTRAINT "ChallengeAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeUserState" ADD CONSTRAINT "ChallengeUserState_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeUserState" ADD CONSTRAINT "ChallengeUserState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationRequirement" ADD CONSTRAINT "CertificationRequirement_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "Certification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationRequirement" ADD CONSTRAINT "CertificationRequirement_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationAward" ADD CONSTRAINT "CertificationAward_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "Certification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationAward" ADD CONSTRAINT "CertificationAward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
