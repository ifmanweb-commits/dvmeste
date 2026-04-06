-- AlterEnum
ALTER TYPE "ChallengeType" ADD VALUE 'LESSON';

-- CreateTable
CREATE TABLE "LessonChallenge" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "LessonChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonCompletion" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastViewedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonChallenge_challengeId_key" ON "LessonChallenge"("challengeId");

-- CreateIndex
CREATE INDEX "LessonChallenge_challengeId_idx" ON "LessonChallenge"("challengeId");

-- CreateIndex
CREATE INDEX "LessonCompletion_userId_idx" ON "LessonCompletion"("userId");

-- CreateIndex
CREATE INDEX "LessonCompletion_challengeId_idx" ON "LessonCompletion"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonCompletion_challengeId_userId_key" ON "LessonCompletion"("challengeId", "userId");

-- AddForeignKey
ALTER TABLE "LessonChallenge" ADD CONSTRAINT "LessonChallenge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonCompletion" ADD CONSTRAINT "LessonCompletion_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonCompletion" ADD CONSTRAINT "LessonCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
