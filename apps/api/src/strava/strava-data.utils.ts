import { StravaActivitySummary } from './types';

const GEOGRAPHIC_FIELDS: (keyof StravaActivitySummary)[] = [
  'start_latlng',
  'end_latlng',
  'location_city',
  'location_state',
  'location_country',
  'map',
];

export function stripGeographicData(
  activity: StravaActivitySummary,
): Omit<StravaActivitySummary, (typeof GEOGRAPHIC_FIELDS)[number]> {
  const sanitized = { ...activity };

  for (const field of GEOGRAPHIC_FIELDS) {
    delete (sanitized as Record<string, unknown>)[field];
  }

  return sanitized;
}
