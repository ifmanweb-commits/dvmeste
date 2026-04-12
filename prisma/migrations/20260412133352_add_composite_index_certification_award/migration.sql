-- DropIndex
DROP INDEX "CertificationAward_userId_idx";

-- CreateIndex
CREATE INDEX "CertificationAward_userId_certificationId_certificateId_idx" ON "CertificationAward"("userId", "certificationId", "certificateId");
