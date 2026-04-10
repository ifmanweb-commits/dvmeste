-- AlterTable
ALTER TABLE "Certification" ADD COLUMN     "badgeUrl" TEXT,
ADD COLUMN     "certificateTemplateId" TEXT,
ADD COLUMN     "rewardType" TEXT NOT NULL DEFAULT 'certificate';

-- CreateIndex
CREATE INDEX "Certification_certificateTemplateId_idx" ON "Certification"("certificateTemplateId");

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_certificateTemplateId_fkey" FOREIGN KEY ("certificateTemplateId") REFERENCES "CertificateTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
