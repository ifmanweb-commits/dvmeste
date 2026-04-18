-- CreateTable
CREATE TABLE "AccessLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT,
    "clientId" TEXT,
    "userType" TEXT,
    "eventType" TEXT NOT NULL,
    "emailHash" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccessLog_createdAt_idx" ON "AccessLog"("createdAt");

-- CreateIndex
CREATE INDEX "AccessLog_userId_idx" ON "AccessLog"("userId");

-- CreateIndex
CREATE INDEX "AccessLog_clientId_idx" ON "AccessLog"("clientId");

-- CreateIndex
CREATE INDEX "AccessLog_emailHash_idx" ON "AccessLog"("emailHash");

-- CreateIndex
CREATE INDEX "AccessLog_ipAddress_idx" ON "AccessLog"("ipAddress");
