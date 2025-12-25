-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "description" TEXT,
ADD COLUMN     "detailsFetched" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "detailsFetchedAt" TIMESTAMP(3);
