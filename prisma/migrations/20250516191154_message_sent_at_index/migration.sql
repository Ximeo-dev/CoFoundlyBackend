-- DropIndex
DROP INDEX "Message_senderId_chatId_idx";

-- CreateIndex
CREATE INDEX "Message_senderId_chatId_sentAt_idx" ON "Message"("senderId", "chatId", "sentAt");
