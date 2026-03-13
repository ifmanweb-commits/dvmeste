-- CreateTable
CREATE TABLE "ArticleCredit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "articleTitle" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "creditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3) NOT NULL,
    "moderatedBy" TEXT,

    CONSTRAINT "ArticleCredit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArticleCredit_userId_idx" ON "ArticleCredit"("userId");

-- CreateIndex
CREATE INDEX "ArticleCredit_year_month_idx" ON "ArticleCredit"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleCredit_userId_year_month_key" ON "ArticleCredit"("userId", "year", "month");

-- AddForeignKey
ALTER TABLE "ArticleCredit" ADD CONSTRAINT "ArticleCredit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
