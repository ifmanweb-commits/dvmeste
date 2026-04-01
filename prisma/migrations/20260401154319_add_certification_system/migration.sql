/*
  Warnings:

  - A unique constraint covering the columns `[certificationId,userId]` on the table `CertificationAward` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CertificationAward_certificationId_userId_key" ON "CertificationAward"("certificationId", "userId");
