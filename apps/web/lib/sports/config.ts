import { ActivityType, SportType } from '@/gql/graphql';
import { Activity, Bike, Footprints, Waves, type LucideIcon } from 'lucide-react';

export interface SportColorConfig {
  bg: string;
  bgMuted: string;
  text: string;
  border: string;
  ring: string;
  chart: string;
}

export interface SportConfig {
  type: SportType;
  icon: LucideIcon;
  href: string;
  labelKey: string;
  goalLabelKey: string;
  colors: SportColorConfig;
}

export const SPORT_CONFIGS: Record<SportType, SportConfig> = {
  [SportType.Run]: {
    type: SportType.Run,
    icon: Footprints,
    href: '/sports/running',
    labelKey: 'navigation.sports.running',
    goalLabelKey: 'sportTypes.run',
    colors: {
      bg: 'bg-lime-300',
      bgMuted: 'bg-lime-300/10',
      text: 'text-lime-500',
      border: 'border-lime-300',
      ring: 'ring-lime-300',
      chart: 'oklch(0.84 0.18 128)',
    },
  },
  [SportType.Ride]: {
    type: SportType.Ride,
    icon: Bike,
    href: '/sports/cycling',
    labelKey: 'navigation.sports.cycling',
    goalLabelKey: 'sportTypes.ride',
    colors: {
      bg: 'bg-purple-400',
      bgMuted: 'bg-purple-400/10',
      text: 'text-purple-500',
      border: 'border-purple-400',
      ring: 'ring-purple-400',
      chart: 'oklch(0.65 0.25 300)',
    },
  },
  [SportType.Swim]: {
    type: SportType.Swim,
    icon: Waves,
    href: '/sports/swimming',
    labelKey: 'navigation.sports.swimming',
    goalLabelKey: 'sportTypes.swim',
    colors: {
      bg: 'bg-cyan-300',
      bgMuted: 'bg-cyan-300/10',
      text: 'text-cyan-500',
      border: 'border-cyan-300',
      ring: 'ring-cyan-300',
      chart: 'oklch(0.80 0.15 200)',
    },
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

export function getSportColors(sportType: SportType | null | undefined): SportColorConfig {
  const defaultColors: SportColorConfig = {
    bg: 'bg-gray-300',
    bgMuted: 'bg-gray-300/10',
    text: 'text-gray-500',
    border: 'border-gray-300',
    ring: 'ring-gray-300',
    chart: 'oklch(0.70 0 0)',
  };
  if (!sportType) return defaultColors;
  return SPORT_CONFIGS[sportType]?.colors ?? defaultColors;
}

const SPORT_TO_ACTIVITY_TYPE: Record<SportType, ActivityType> = {
  [SportType.Run]: ActivityType.Run,
  [SportType.Ride]: ActivityType.Ride,
  [SportType.Swim]: ActivityType.Swim,
};

export function getPrimaryActivityType(sportType: SportType): ActivityType {
  return SPORT_TO_ACTIVITY_TYPE[sportType];
}
