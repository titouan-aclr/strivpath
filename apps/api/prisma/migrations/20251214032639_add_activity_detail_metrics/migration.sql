-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "averageWatts" DOUBLE PRECISION,
ADD COLUMN     "calories" DOUBLE PRECISION,
ADD COLUMN     "elevHigh" DOUBLE PRECISION,
ADD COLUMN     "elevLow" DOUBLE PRECISION,
ADD COLUMN     "maxWatts" INTEGER,
ADD COLUMN     "splits" JSONB,
ADD COLUMN     "weightedAverageWatts" DOUBLE PRECISION;
