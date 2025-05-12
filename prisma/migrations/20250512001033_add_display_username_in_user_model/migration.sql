/*
  Warnings:

  - A unique constraint covering the columns `[displayUsername]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "displayUsername" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_displayUsername_key" ON "User"("displayUsername");
