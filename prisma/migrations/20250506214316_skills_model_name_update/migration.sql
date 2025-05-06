/*
  Warnings:

  - You are about to alter the column `name` on the `Skill` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "Skill" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255);

-- CreateIndex
CREATE INDEX "Skill_name_idx" ON "Skill"("name");
