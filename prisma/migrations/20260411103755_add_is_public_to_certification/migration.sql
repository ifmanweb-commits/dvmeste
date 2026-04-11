-- AlterTable
ALTER TABLE "Certification" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Certification_isPublic_idx" ON "Certification"("isPublic");
