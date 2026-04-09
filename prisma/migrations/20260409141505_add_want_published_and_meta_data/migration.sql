-- AlterTable
ALTER TABLE "User" ADD COLUMN     "metaData" JSON NOT NULL DEFAULT '{}',
ADD COLUMN     "wantPublished" BOOLEAN NOT NULL DEFAULT false;
