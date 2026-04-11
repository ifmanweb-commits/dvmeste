-- AlterTable
ALTER TABLE "CertificationAward" ADD COLUMN     "certificateId" TEXT;

-- CreateIndex
CREATE INDEX "CertificationAward_certificateId_idx" ON "CertificationAward"("certificateId");

-- AddForeignKey
ALTER TABLE "CertificationAward" ADD CONSTRAINT "CertificationAward_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
