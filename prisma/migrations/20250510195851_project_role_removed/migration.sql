/*
  Warnings:

  - You are about to drop the column `matchStatus` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `projectRoleId` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the `ProjectRole` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[profileAId,profileBId]` on the table `Match` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `profileAId` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileBId` to the `Match` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserProfile" DROP CONSTRAINT "UserProfile_projectRoleId_fkey";

-- DropIndex
DROP INDEX "Match_userId_projectId_idx";

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "matchStatus",
DROP COLUMN "projectId",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "profileAId" INTEGER NOT NULL,
ADD COLUMN     "profileBId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "projectRoleId";

-- DropTable
DROP TABLE "ProjectRole";

-- CreateTable
CREATE TABLE "Swipe" (
    "id" BIGSERIAL NOT NULL,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "isLiked" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Swipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Swipe_toUserId_idx" ON "Swipe"("toUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Swipe_fromUserId_toUserId_key" ON "Swipe"("fromUserId", "toUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_profileAId_profileBId_key" ON "Match"("profileAId", "profileBId");

-- AddForeignKey
ALTER TABLE "Swipe" ADD CONSTRAINT "Swipe_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Swipe" ADD CONSTRAINT "Swipe_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_profileAId_fkey" FOREIGN KEY ("profileAId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_profileBId_fkey" FOREIGN KEY ("profileBId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
