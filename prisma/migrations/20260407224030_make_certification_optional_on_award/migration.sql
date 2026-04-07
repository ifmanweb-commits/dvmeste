-- DropForeignKey
ALTER TABLE "CertificationAward" DROP CONSTRAINT "CertificationAward_certificationId_fkey";

-- AlterTable
ALTER TABLE "CertificationAward" ALTER COLUMN "certificationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CertificationAward" ADD CONSTRAINT "CertificationAward_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "Certification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
