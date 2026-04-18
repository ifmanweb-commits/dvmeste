-- CreateTable
CREATE TABLE "ConsentDocument" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "documentUrl" TEXT,
    "content" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsentDocument_isActive_idx" ON "ConsentDocument"("isActive");

-- CreateIndex
CREATE INDEX "ConsentDocument_version_idx" ON "ConsentDocument"("version");
