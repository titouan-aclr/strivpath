-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurrenceEndDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Goal_userId_sportType_idx" ON "Goal"("userId", "sportType");
