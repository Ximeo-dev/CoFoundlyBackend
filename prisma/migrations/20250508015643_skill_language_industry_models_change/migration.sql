/*
  Warnings:

  - The primary key for the `Industry` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Industry` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Language` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Language` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `ProjectRole` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ProjectRole` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Skill` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Skill` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `projectRoleId` column on the `UserProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `_IndustryToUserProfile` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_LanguageToUserProfile` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_SkillToUserProfile` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `A` on the `_IndustryToUserProfile` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `A` on the `_LanguageToUserProfile` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `A` on the `_SkillToUserProfile` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "UserProfile" DROP CONSTRAINT "UserProfile_projectRoleId_fkey";

-- DropForeignKey
ALTER TABLE "_IndustryToUserProfile" DROP CONSTRAINT "_IndustryToUserProfile_A_fkey";

-- DropForeignKey
ALTER TABLE "_LanguageToUserProfile" DROP CONSTRAINT "_LanguageToUserProfile_A_fkey";

-- DropForeignKey
ALTER TABLE "_SkillToUserProfile" DROP CONSTRAINT "_SkillToUserProfile_A_fkey";

-- AlterTable
ALTER TABLE "Industry" DROP CONSTRAINT "Industry_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Industry_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Language" DROP CONSTRAINT "Language_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Language_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ProjectRole" DROP CONSTRAINT "ProjectRole_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ProjectRole_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Skill" DROP CONSTRAINT "Skill_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Skill_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "projectRoleId",
ADD COLUMN     "projectRoleId" INTEGER;

-- AlterTable
ALTER TABLE "_IndustryToUserProfile" DROP CONSTRAINT "_IndustryToUserProfile_AB_pkey",
DROP COLUMN "A",
ADD COLUMN     "A" INTEGER NOT NULL,
ADD CONSTRAINT "_IndustryToUserProfile_AB_pkey" PRIMARY KEY ("A", "B");

-- AlterTable
ALTER TABLE "_LanguageToUserProfile" DROP CONSTRAINT "_LanguageToUserProfile_AB_pkey",
DROP COLUMN "A",
ADD COLUMN     "A" INTEGER NOT NULL,
ADD CONSTRAINT "_LanguageToUserProfile_AB_pkey" PRIMARY KEY ("A", "B");

-- AlterTable
ALTER TABLE "_SkillToUserProfile" DROP CONSTRAINT "_SkillToUserProfile_AB_pkey",
DROP COLUMN "A",
ADD COLUMN     "A" INTEGER NOT NULL,
ADD CONSTRAINT "_SkillToUserProfile_AB_pkey" PRIMARY KEY ("A", "B");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_projectRoleId_fkey" FOREIGN KEY ("projectRoleId") REFERENCES "ProjectRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SkillToUserProfile" ADD CONSTRAINT "_SkillToUserProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LanguageToUserProfile" ADD CONSTRAINT "_LanguageToUserProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IndustryToUserProfile" ADD CONSTRAINT "_IndustryToUserProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
