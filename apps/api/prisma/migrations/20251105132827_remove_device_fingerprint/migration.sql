/*
  Warnings:

  - You are about to drop the column `deviceFingerprint` on the `RefreshToken` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RefreshToken" DROP COLUMN "deviceFingerprint";
