/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `languages` on the `UserProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "avatarUrl",
DROP COLUMN "languages",
ADD COLUMN     "projectRoleId" TEXT;

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectRole" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "ProjectRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Industry" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LanguageToUserProfile" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_LanguageToUserProfile_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_IndustryToUserProfile" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_IndustryToUserProfile_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");

-- CreateIndex
CREATE INDEX "Language_name_idx" ON "Language"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRole_name_key" ON "ProjectRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Industry_name_key" ON "Industry"("name");

-- CreateIndex
CREATE INDEX "Industry_name_idx" ON "Industry"("name");

-- CreateIndex
CREATE INDEX "_LanguageToUserProfile_B_index" ON "_LanguageToUserProfile"("B");

-- CreateIndex
CREATE INDEX "_IndustryToUserProfile_B_index" ON "_IndustryToUserProfile"("B");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_projectRoleId_fkey" FOREIGN KEY ("projectRoleId") REFERENCES "ProjectRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LanguageToUserProfile" ADD CONSTRAINT "_LanguageToUserProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LanguageToUserProfile" ADD CONSTRAINT "_LanguageToUserProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IndustryToUserProfile" ADD CONSTRAINT "_IndustryToUserProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IndustryToUserProfile" ADD CONSTRAINT "_IndustryToUserProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
