-- DropForeignKey
ALTER TABLE "ReadReceipt" DROP CONSTRAINT "ReadReceipt_messageId_fkey";

-- AddForeignKey
ALTER TABLE "ReadReceipt" ADD CONSTRAINT "ReadReceipt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
