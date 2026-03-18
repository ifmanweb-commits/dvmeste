-- AlterTable
ALTER TABLE "PushSubscription" ADD COLUMN     "browser" TEXT,
ADD COLUMN     "deviceOs" TEXT,
ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "userAgent" TEXT;
