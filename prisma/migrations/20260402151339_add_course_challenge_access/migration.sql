-- CreateTable
CREATE TABLE "CourseChallengeAccess" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CourseChallengeAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseChallengeAccess_courseId_idx" ON "CourseChallengeAccess"("courseId");

-- CreateIndex
CREATE INDEX "CourseChallengeAccess_challengeId_idx" ON "CourseChallengeAccess"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseChallengeAccess_courseId_challengeId_status_key" ON "CourseChallengeAccess"("courseId", "challengeId", "status");

-- AddForeignKey
ALTER TABLE "CourseChallengeAccess" ADD CONSTRAINT "CourseChallengeAccess_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseChallengeAccess" ADD CONSTRAINT "CourseChallengeAccess_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
