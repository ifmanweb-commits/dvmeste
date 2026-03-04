-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "creditedMonth" INTEGER,
ADD COLUMN     "creditedYear" INTEGER,
ADD COLUMN     "moderationStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "moderatorComment" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Article_moderationStatus_idx" ON "Article"("moderationStatus");

-- CreateIndex
CREATE INDEX "Article_creditedYear_creditedMonth_idx" ON "Article"("creditedYear", "creditedMonth");
