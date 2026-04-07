/*
  Warnings:

  - The values [IN_REVIEW] on the enum `QuestionnaireStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "QuestionnaireStatus_new" AS ENUM ('SUBMITTED', 'REVIEWING', 'APPROVED', 'REJECTED');
ALTER TABLE "public"."QuestionnaireSubmission" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "QuestionnaireSubmission" ALTER COLUMN "status" TYPE "QuestionnaireStatus_new" USING ("status"::text::"QuestionnaireStatus_new");
ALTER TYPE "QuestionnaireStatus" RENAME TO "QuestionnaireStatus_old";
ALTER TYPE "QuestionnaireStatus_new" RENAME TO "QuestionnaireStatus";
DROP TYPE "public"."QuestionnaireStatus_old";
ALTER TABLE "QuestionnaireSubmission" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
COMMIT;
