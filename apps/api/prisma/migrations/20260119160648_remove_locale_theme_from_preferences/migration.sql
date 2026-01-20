/*
  Warnings:

  - You are about to drop the column `locale` on the `UserPreferences` table. All the data in the column will be lost.
  - You are about to drop the column `theme` on the `UserPreferences` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserPreferences" DROP COLUMN "locale",
DROP COLUMN "theme";
