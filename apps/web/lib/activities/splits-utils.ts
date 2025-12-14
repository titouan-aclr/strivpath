import { SportType } from '@/gql/graphql';
import type { Split, ChartDataPoint } from './types';

export function prepareSplitsForChart(splits: Split[] | null | undefined, sportType: SportType): ChartDataPoint[] {
  if (!splits || splits.length === 0) return [];

  const isPaceMetric = sportType === SportType.Run || sportType === SportType.Swim;

  return splits.map((split, index) => {
    const distanceKm = split.distance / 1000;
    const timeMinutes = split.movingTime / 60;

    const pace = isPaceMetric ? timeMinutes / distanceKm : distanceKm / (split.movingTime / 3600);

    return {
      km: index + 1,
      pace,
      speed: split.averageSpeed * 3.6,
      label: `Km ${index + 1}`,
    };
  });
}

export function calculateAveragePace(splits: Split[]): number {
  if (splits.length === 0) return 0;

  const totalDistance = splits.reduce((sum, split) => sum + split.distance, 0);
  const totalTime = splits.reduce((sum, split) => sum + split.movingTime, 0);

  return totalTime / 60 / (totalDistance / 1000);
}

export function formatPaceValue(paceMinPerKm: number): string {
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.round((paceMinPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
