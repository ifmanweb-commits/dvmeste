/*
  Warnings:

  - The values [REJECTED,CONTACTED,APPOINTMENT,FREE_SESSION,PAID_SESSION,NO_CONTACT,CLIENT_REJECTED,ARCHIVED] on the enum `LeadStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "LeadResolution" AS ENUM ('PSYCHOLOGIST_REJECTED', 'NO_CONTACT', 'NO_AGREEMENT', 'CLIENT_DROPPED', 'FREE_ONLY', 'PAID_COMPLETED');

-- AlterEnum
BEGIN;
CREATE TYPE "LeadStatus_new" AS ENUM ('NEW', 'ACCEPTED', 'COMPLETED');
ALTER TABLE "public"."Lead" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Lead" ALTER COLUMN "status" TYPE "LeadStatus_new" USING ("status"::text::"LeadStatus_new");
ALTER TYPE "LeadStatus" RENAME TO "LeadStatus_old";
ALTER TYPE "LeadStatus_new" RENAME TO "LeadStatus";
DROP TYPE "public"."LeadStatus_old";
ALTER TABLE "Lead" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "resolution" "LeadResolution";
