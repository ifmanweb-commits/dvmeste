-- AlterTable
ALTER TABLE "Blocks" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "emailVerified" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "clientId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_clientId_idx" ON "Session"("clientId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
