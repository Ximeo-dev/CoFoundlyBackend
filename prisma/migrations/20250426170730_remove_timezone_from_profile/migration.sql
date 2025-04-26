/*
  Warnings:

  - You are about to drop the column `timezone` on the `Profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "timezone";

-- AlterTable
ALTER TABLE "_BlogPostTags" ADD CONSTRAINT "_BlogPostTags_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_BlogPostTags_AB_unique";

-- AlterTable
ALTER TABLE "_ChatParticipants" ADD CONSTRAINT "_ChatParticipants_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ChatParticipants_AB_unique";

-- AlterTable
ALTER TABLE "_InterestToUser" ADD CONSTRAINT "_InterestToUser_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_InterestToUser_AB_unique";

-- AlterTable
ALTER TABLE "_ProfileToSkill" ADD CONSTRAINT "_ProfileToSkill_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ProfileToSkill_AB_unique";

-- AlterTable
ALTER TABLE "_ProjectMembers" ADD CONSTRAINT "_ProjectMembers_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ProjectMembers_AB_unique";
