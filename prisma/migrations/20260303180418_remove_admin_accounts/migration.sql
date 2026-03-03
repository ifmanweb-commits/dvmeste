/*
  Warnings:

  - You are about to drop the `admin_accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `admin_password_reset_codes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "admin_password_reset_codes" DROP CONSTRAINT "admin_password_reset_codes_adminId_fkey";

-- DropTable
DROP TABLE "admin_accounts";

-- DropTable
DROP TABLE "admin_password_reset_codes";
