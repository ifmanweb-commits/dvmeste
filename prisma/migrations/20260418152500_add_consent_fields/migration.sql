-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "consentGivenAt" TIMESTAMP(3),
ADD COLUMN     "consentIp" TEXT,
ADD COLUMN     "consentUserAgent" TEXT,
ADD COLUMN     "consentVersion" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "consentGivenAt" TIMESTAMP(3),
ADD COLUMN     "consentIp" TEXT,
ADD COLUMN     "consentUserAgent" TEXT,
ADD COLUMN     "consentVersion" TEXT;
