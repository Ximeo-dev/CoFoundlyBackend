/*
  Warnings:

  - You are about to drop the column `fromUserId` on the `Swipe` table. All the data in the column will be lost.
  - You are about to drop the column `toUserId` on the `Swipe` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fromProfileId,toProfileId]` on the table `Swipe` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fromProfileId` to the `Swipe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toProfileId` to the `Swipe` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Swipe" DROP CONSTRAINT "Swipe_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "Swipe" DROP CONSTRAINT "Swipe_toUserId_fkey";

-- DropIndex
DROP INDEX "Swipe_fromUserId_toUserId_key";

-- DropIndex
DROP INDEX "Swipe_toUserId_idx";

-- AlterTable
ALTER TABLE "Swipe" DROP COLUMN "fromUserId",
DROP COLUMN "toUserId",
ADD COLUMN     "fromProfileId" INTEGER NOT NULL,
ADD COLUMN     "toProfileId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Swipe_toProfileId_idx" ON "Swipe"("toProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Swipe_fromProfileId_toProfileId_key" ON "Swipe"("fromProfileId", "toProfileId");

-- AddForeignKey
ALTER TABLE "Swipe" ADD CONSTRAINT "Swipe_fromProfileId_fkey" FOREIGN KEY ("fromProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Swipe" ADD CONSTRAINT "Swipe_toProfileId_fkey" FOREIGN KEY ("toProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
