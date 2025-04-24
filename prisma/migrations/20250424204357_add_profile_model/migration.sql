/*
  Warnings:

  - You are about to drop the column `bio` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `User` table. All the data in the column will be lost.
  - The primary key for the `UserSkill` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `UserSkill` table. All the data in the column will be lost.
  - The primary key for the `_BlogPostTags` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_ChatParticipants` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_InterestToUser` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_ProjectMembers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_BlogPostTags` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_ChatParticipants` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_InterestToUser` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_ProjectMembers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `profileId` to the `UserSkill` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserSkill" DROP CONSTRAINT "UserSkill_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "bio",
DROP COLUMN "timezone",
ADD COLUMN     "age" INTEGER NOT NULL DEFAULT 18,
ADD COLUMN     "avatarUrl" TEXT;

-- AlterTable
ALTER TABLE "UserSkill" DROP CONSTRAINT "UserSkill_pkey",
DROP COLUMN "userId",
ADD COLUMN     "profileId" INTEGER NOT NULL,
ADD CONSTRAINT "UserSkill_pkey" PRIMARY KEY ("profileId", "skillId");

-- AlterTable
ALTER TABLE "_BlogPostTags" DROP CONSTRAINT "_BlogPostTags_AB_pkey";

-- AlterTable
ALTER TABLE "_ChatParticipants" DROP CONSTRAINT "_ChatParticipants_AB_pkey";

-- AlterTable
ALTER TABLE "_InterestToUser" DROP CONSTRAINT "_InterestToUser_AB_pkey";

-- AlterTable
ALTER TABLE "_ProjectMembers" DROP CONSTRAINT "_ProjectMembers_AB_pkey";

-- CreateTable
CREATE TABLE "Profile" (
    "id" SERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "bio" TEXT,
    "timezone" TEXT,
    "portfolio" TEXT,
    "job" TEXT,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Profile_userId_idx" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_BlogPostTags_AB_unique" ON "_BlogPostTags"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_ChatParticipants_AB_unique" ON "_ChatParticipants"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_InterestToUser_AB_unique" ON "_InterestToUser"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectMembers_AB_unique" ON "_ProjectMembers"("A", "B");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
