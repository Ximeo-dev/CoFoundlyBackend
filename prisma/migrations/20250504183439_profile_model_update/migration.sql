/*
  Warnings:

  - The `portfolio` column on the `Profile` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "city" TEXT,
ADD COLUMN     "languages" TEXT[],
ADD COLUMN     "niches" TEXT[],
ADD COLUMN     "timezone" TEXT,
DROP COLUMN "portfolio",
ADD COLUMN     "portfolio" TEXT[];
