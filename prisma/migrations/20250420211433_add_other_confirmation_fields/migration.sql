-- AlterTable
ALTER TABLE "SecuritySettings" ADD COLUMN     "changeEmailToken" TEXT,
ADD COLUMN     "resetPasswordToken" TEXT;
