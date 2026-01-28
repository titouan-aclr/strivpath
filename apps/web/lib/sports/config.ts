import { Footprints, Bike, Waves, Activity, type LucideIcon } from 'lucide-react';
import { SportType } from '@/gql/graphql';

export interface SportConfig {
  type: SportType;
  icon: LucideIcon;
  href: string;
  labelKey: string;
  goalLabelKey: string;
}

export const SPORT_CONFIGS: Record<SportType, SportConfig> = {
  [SportType.Run]: {
    type: SportType.Run,
    icon: Footprints,
    href: '/sports/running',
    labelKey: 'navigation.sports.running',
    goalLabelKey: 'sportTypes.run',
  },
  [SportType.Ride]: {
    type: SportType.Ride,
    icon: Bike,
    href: '/sports/cycling',
    labelKey: 'navigation.sports.cycling',
    goalLabelKey: 'sportTypes.ride',
  },
  [SportType.Swim]: {
    type: SportType.Swim,
    icon: Waves,
    href: '/sports/swimming',
    labelKey: 'navigation.sports.swimming',
    goalLabelKey: 'sportTypes.swim',
  },
};

export const ALL_SPORT_TYPES = Object.values(SportType);

export function getSportConfig(type: SportType): SportConfig | undefined {
  return SPORT_CONFIGS[type];
}

export function getFilteredSportConfigs(selectedSports: SportType[]): SportConfig[] {
  return selectedSports
    .map(sport => SPORT_CONFIGS[sport])
    .filter((config): config is SportConfig => config !== undefined);
}

export function getSportIcon(sportType: SportType | null | undefined): LucideIcon {
  if (!sportType) return Activity;
  return SPORT_CONFIGS[sportType]?.icon ?? Activity;
}
