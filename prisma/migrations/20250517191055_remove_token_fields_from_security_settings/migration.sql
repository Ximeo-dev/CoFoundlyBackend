/*
  Warnings:

  - You are about to drop the column `changeEmailToken` on the `SecuritySettings` table. All the data in the column will be lost.
  - You are about to drop the column `emailConfirmationToken` on the `SecuritySettings` table. All the data in the column will be lost.
  - You are about to drop the column `resetPasswordToken` on the `SecuritySettings` table. All the data in the column will be lost.
  - You are about to drop the column `twoFactorToken` on the `SecuritySettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SecuritySettings" DROP COLUMN "changeEmailToken",
DROP COLUMN "emailConfirmationToken",
DROP COLUMN "resetPasswordToken",
DROP COLUMN "twoFactorToken";
