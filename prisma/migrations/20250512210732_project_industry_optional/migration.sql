-- DropForeignKey
ALTER TABLE "ProjectRequirement" DROP CONSTRAINT "ProjectRequirement_industryId_fkey";

-- AlterTable
ALTER TABLE "ProjectRequirement" ALTER COLUMN "industryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ProjectRequirement" ADD CONSTRAINT "ProjectRequirement_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
