/*
  Warnings:

  - You are about to drop the column `tokenHash` on the `RefreshToken` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[jti]` on the table `RefreshToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `jti` to the `RefreshToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."RefreshToken_tokenHash_key";

-- DropIndex
DROP INDEX "public"."RefreshToken_tokenHash_revoked_idx";

-- AlterTable
ALTER TABLE "RefreshToken" DROP COLUMN "tokenHash",
ADD COLUMN     "jti" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_jti_key" ON "RefreshToken"("jti");

-- CreateIndex
CREATE INDEX "RefreshToken_jti_revoked_idx" ON "RefreshToken"("jti", "revoked");
