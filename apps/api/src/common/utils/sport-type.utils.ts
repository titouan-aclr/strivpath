import { SportType } from '../../user-preferences/enums/sport-type.enum';

export const STRAVA_SPORT_TYPE_MAPPING: Record<SportType, readonly string[]> = {
  [SportType.RUN]: ['Run', 'TrailRun', 'VirtualRun'],
  [SportType.RIDE]: ['Ride', 'MountainBikeRide', 'VirtualRide', 'EBikeRide', 'EMountainBikeRide', 'Velomobile'],
  [SportType.SWIM]: ['Swim'],
} as const;

export function getStravaTypesForSport(sport: SportType): string[] {
  return [...(STRAVA_SPORT_TYPE_MAPPING[sport] ?? [])];
}

export function getSportTypeFromStravaType(stravaType: string): SportType | null {
  for (const [sportType, stravaTypes] of Object.entries(STRAVA_SPORT_TYPE_MAPPING)) {
    if (stravaTypes.includes(stravaType)) {
      return sportType as SportType;
    }
  }
  return null;
}
