-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'CATALOG_PUBLISHED';
ALTER TYPE "NotificationType" ADD VALUE 'PHOTO_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'DOCUMENT_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'CERTIFICATION_PASSED';
ALTER TYPE "NotificationType" ADD VALUE 'WORK_REVIEWED';
ALTER TYPE "NotificationType" ADD VALUE 'QUESTIONNAIRE_REVIEWED';
ALTER TYPE "NotificationType" ADD VALUE 'MODERATOR_MESSAGE';
