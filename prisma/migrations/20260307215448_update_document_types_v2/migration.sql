/*
  Warnings:

  - The values [DIPLOMA,CERTIFICATE,QUALIFICATION,SESSION_RECORD_LINK] on the enum `DocumentType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DocumentType_new" AS ENUM ('ACADEMIC_EDUCATION', 'PROFESSIONAL_TRAINING', 'COURSE', 'SUPPORTING_DOC', 'LINK', 'PHOTO', 'OTHER');
ALTER TABLE "Document" ALTER COLUMN "type" TYPE "DocumentType_new" USING ("type"::text::"DocumentType_new");
ALTER TYPE "DocumentType" RENAME TO "DocumentType_old";
ALTER TYPE "DocumentType_new" RENAME TO "DocumentType";
DROP TYPE "public"."DocumentType_old";
COMMIT;
