-- CreateEnum
CREATE TYPE "TipType" AS ENUM ('TOAST', 'MODAL');

-- CreateTable
CREATE TABLE "OnboardingTip" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "TipType" NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "delaySeconds" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingTip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTipDismissal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipId" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTipDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OnboardingTip_pageUrl_idx" ON "OnboardingTip"("pageUrl");

-- CreateIndex
CREATE INDEX "OnboardingTip_type_idx" ON "OnboardingTip"("type");

-- CreateIndex
CREATE INDEX "OnboardingTip_isActive_idx" ON "OnboardingTip"("isActive");

-- CreateIndex
CREATE INDEX "UserTipDismissal_userId_idx" ON "UserTipDismissal"("userId");

-- CreateIndex
CREATE INDEX "UserTipDismissal_tipId_idx" ON "UserTipDismissal"("tipId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTipDismissal_userId_tipId_key" ON "UserTipDismissal"("userId", "tipId");

-- AddForeignKey
ALTER TABLE "UserTipDismissal" ADD CONSTRAINT "UserTipDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTipDismissal" ADD CONSTRAINT "UserTipDismissal_tipId_fkey" FOREIGN KEY ("tipId") REFERENCES "OnboardingTip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
