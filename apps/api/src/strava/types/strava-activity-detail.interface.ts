import { StravaActivitySummary } from './strava-activity.interface';

export interface StravaSplit {
  distance: number;
  elapsed_time: number;
  elevation_difference?: number;
  moving_time: number;
  split: number;
  average_speed: number;
  pace_zone?: number;
}

export interface StravaActivityDetail extends StravaActivitySummary {
  calories?: number;
  splits_metric?: StravaSplit[];
  description?: string;
}
