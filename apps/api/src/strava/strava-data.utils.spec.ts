import { stripGeographicData } from './strava-data.utils';
import { StravaActivitySummary } from './types';

describe('stripGeographicData', () => {
  const createMockActivity = (overrides?: Partial<StravaActivitySummary>): StravaActivitySummary => ({
    id: 12345,
    resource_state: 2,
    external_id: 'garmin_push_123',
    upload_id: 67890,
    athlete: { id: 111, resource_state: 1 },
    name: 'Morning Run',
    distance: 10000,
    moving_time: 3600,
    elapsed_time: 3700,
    total_elevation_gain: 120,
    type: 'Run',
    sport_type: 'Run',
    workout_type: null,
    start_date: '2024-01-15T08:00:00Z',
    start_date_local: '2024-01-15T09:00:00Z',
    timezone: '(GMT+01:00) Europe/Paris',
    utc_offset: 3600,
    location_city: 'Paris',
    location_state: 'Île-de-France',
    location_country: 'France',
    achievement_count: 3,
    kudos_count: 5,
    comment_count: 1,
    athlete_count: 1,
    photo_count: 0,
    map: {
      id: 'a12345',
      summary_polyline: 'encodedPolylineData',
      resource_state: 2,
    },
    trainer: false,
    commute: false,
    manual: false,
    private: false,
    visibility: 'everyone',
    flagged: false,
    gear_id: 'g123',
    start_latlng: [48.8566, 2.3522],
    end_latlng: [48.8606, 2.3376],
    average_speed: 2.78,
    max_speed: 4.2,
    has_heartrate: true,
    average_heartrate: 150,
    max_heartrate: 175,
    heartrate_opt_out: false,
    display_hide_heartrate_option: false,
    pr_count: 1,
    total_photo_count: 0,
    has_kudoed: false,
    ...overrides,
  });

  it('should remove all geographic fields', () => {
    const activity = createMockActivity();
    const result = stripGeographicData(activity);

    expect(result).not.toHaveProperty('start_latlng');
    expect(result).not.toHaveProperty('end_latlng');
    expect(result).not.toHaveProperty('location_city');
    expect(result).not.toHaveProperty('location_state');
    expect(result).not.toHaveProperty('location_country');
    expect(result).not.toHaveProperty('map');
  });

  it('should preserve all non-geographic fields', () => {
    const activity = createMockActivity();
    const result = stripGeographicData(activity);

    expect(result.id).toBe(12345);
    expect(result.name).toBe('Morning Run');
    expect(result.distance).toBe(10000);
    expect(result.moving_time).toBe(3600);
    expect(result.type).toBe('Run');
    expect(result.average_speed).toBe(2.78);
    expect(result.average_heartrate).toBe(150);
    expect(result.timezone).toBe('(GMT+01:00) Europe/Paris');
  });

  it('should not mutate the original activity', () => {
    const activity = createMockActivity();
    stripGeographicData(activity);

    expect(activity.start_latlng).toEqual([48.8566, 2.3522]);
    expect(activity.location_city).toBe('Paris');
    expect(activity.map.summary_polyline).toBe('encodedPolylineData');
  });

  it('should handle null geographic fields gracefully', () => {
    const activity = createMockActivity({
      start_latlng: null,
      end_latlng: null,
      location_city: null,
      location_state: null,
      location_country: null,
    });

    const result = stripGeographicData(activity);

    expect(result).not.toHaveProperty('start_latlng');
    expect(result).not.toHaveProperty('end_latlng');
    expect(result).not.toHaveProperty('location_city');
    expect(result).not.toHaveProperty('location_state');
    expect(result).not.toHaveProperty('location_country');
    expect(result).not.toHaveProperty('map');
  });
});
