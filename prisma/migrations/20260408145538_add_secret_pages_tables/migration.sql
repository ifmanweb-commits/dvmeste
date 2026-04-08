-- CreateTable
CREATE TABLE "SecretPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecretPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Key" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "actionsJson" JSONB NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyUse" (
    "id" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KeyUse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SecretPage_slug_key" ON "SecretPage"("slug");

-- CreateIndex
CREATE INDEX "SecretPage_slug_idx" ON "SecretPage"("slug");

-- CreateIndex
CREATE INDEX "SecretPage_isActive_idx" ON "SecretPage"("isActive");

-- CreateIndex
CREATE INDEX "UserAccess_userId_idx" ON "UserAccess"("userId");

-- CreateIndex
CREATE INDEX "UserAccess_resourceType_resourceId_idx" ON "UserAccess"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "UserAccess_grantedBy_idx" ON "UserAccess"("grantedBy");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccess_userId_resourceType_resourceId_key" ON "UserAccess"("userId", "resourceType", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Key_code_key" ON "Key"("code");

-- CreateIndex
CREATE INDEX "Key_code_idx" ON "Key"("code");

-- CreateIndex
CREATE INDEX "Key_isActive_idx" ON "Key"("isActive");

-- CreateIndex
CREATE INDEX "KeyUse_keyId_idx" ON "KeyUse"("keyId");

-- CreateIndex
CREATE INDEX "KeyUse_userId_idx" ON "KeyUse"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KeyUse_keyId_userId_key" ON "KeyUse"("keyId", "userId");

-- AddForeignKey
ALTER TABLE "KeyUse" ADD CONSTRAINT "KeyUse_keyId_fkey" FOREIGN KEY ("keyId") REFERENCES "Key"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyUse" ADD CONSTRAINT "KeyUse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
