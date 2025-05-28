-- DropIndex
DROP INDEX "Swipe_toProfileId_idx";

-- CreateIndex
CREATE INDEX "Swipe_toProfileId_fromProfileId_isLiked_idx" ON "Swipe"("toProfileId", "fromProfileId", "isLiked");
